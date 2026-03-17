package objects

import (
	"fmt"
	"strings"

	"k8s.io/apimachinery/pkg/util/yaml"
)

// RelationGraph represents the dependency graph of resources in a release.
type RelationGraph struct {
	Nodes []RelationNode `json:"nodes"`
	Edges []RelationEdge `json:"edges"`
}

// RelationNode represents a single resource in the graph.
type RelationNode struct {
	ID        string `json:"id"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	InRelease bool   `json:"inRelease"`
}

// RelationEdge represents a dependency between two resources.
type RelationEdge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Type   string `json:"type"`
}

type edgeAdder func(sourceID, targetKind, targetName, edgeType string)

type workloadLabels struct {
	id     string
	labels map[string]interface{}
}

func nodeID(kind, name string) string {
	return kind + "/" + name
}

func docKindAndName(doc map[string]interface{}) (string, string) {
	kind, _ := doc["kind"].(string)
	metadata, _ := doc["metadata"].(map[string]interface{})
	name, _ := metadata["name"].(string)
	return kind, name
}

// ExtractRelations parses a manifest and returns the resource relation graph.
func ExtractRelations(manifest string) RelationGraph {
	docs := parseManifestDocs(manifest)
	nodes := buildNodeSet(docs)

	var edges []RelationEdge
	addEdge := func(sourceID, targetKind, targetName, edgeType string) {
		tid := nodeID(targetKind, targetName)
		if tid == sourceID {
			return
		}
		if _, exists := nodes[tid]; !exists {
			nodes[tid] = RelationNode{ID: tid, Kind: targetKind, Name: targetName, InRelease: false}
		}
		edges = append(edges, RelationEdge{Source: sourceID, Target: tid, Type: edgeType})
	}

	workloads := buildWorkloadIndex(docs)
	for _, doc := range docs {
		extractDocEdges(doc, workloads, addEdge)
	}

	edges = deduplicateEdges(edges)

	nodeSlice := make([]RelationNode, 0, len(nodes))
	for _, n := range nodes {
		nodeSlice = append(nodeSlice, n)
	}

	return RelationGraph{Nodes: nodeSlice, Edges: edges}
}

func parseManifestDocs(manifest string) []map[string]interface{} {
	dec := yaml.NewYAMLOrJSONDecoder(strings.NewReader(manifest), 4096)
	var docs []map[string]interface{}
	for {
		var tmp map[string]interface{}
		if err := dec.Decode(&tmp); err != nil {
			break
		}
		kind, _ := tmp["kind"].(string)
		if kind != "" {
			docs = append(docs, tmp)
		}
	}
	return docs
}

func buildNodeSet(docs []map[string]interface{}) map[string]RelationNode {
	nodes := map[string]RelationNode{}
	for _, doc := range docs {
		kind, name := docKindAndName(doc)
		id := nodeID(kind, name)
		nodes[id] = RelationNode{ID: id, Kind: kind, Name: name, InRelease: true}
	}
	return nodes
}

func buildWorkloadIndex(docs []map[string]interface{}) []workloadLabels {
	var workloads []workloadLabels
	for _, doc := range docs {
		kind, name := docKindAndName(doc)
		lbls := getTemplateLabels(doc)
		if lbls != nil {
			workloads = append(workloads, workloadLabels{id: nodeID(kind, name), labels: lbls})
		}
	}
	return workloads
}

func getTemplateLabels(doc map[string]interface{}) map[string]interface{} {
	spec, _ := doc["spec"].(map[string]interface{})
	if spec == nil {
		return nil
	}
	tpl, _ := spec["template"].(map[string]interface{})
	if tpl == nil {
		return nil
	}
	tplMeta, _ := tpl["metadata"].(map[string]interface{})
	if tplMeta == nil {
		return nil
	}
	lbls, _ := tplMeta["labels"].(map[string]interface{})
	return lbls
}

func extractDocEdges(doc map[string]interface{}, workloads []workloadLabels, addEdge edgeAdder) {
	kind, name := docKindAndName(doc)
	srcID := nodeID(kind, name)

	extractOwnerRefs(doc, srcID, addEdge)
	collectRefFields(doc, srcID, addEdge)

	for _, podSpec := range findPodSpecs(kind, doc) {
		extractVolumes(podSpec, srcID, addEdge)
		extractEnvRefs(podSpec, srcID, addEdge)
		extractServiceAccount(podSpec, srcID, addEdge)
	}

	if kind == "Service" {
		extractServiceSelector(doc, srcID, workloads, addEdge)
	}
	if kind == "Ingress" {
		extractIngressBackends(doc, srcID, addEdge)
	}
	if kind == "RoleBinding" || kind == "ClusterRoleBinding" {
		extractRoleBindingRefs(doc, srcID, addEdge)
	}
}

func extractOwnerRefs(doc map[string]interface{}, srcID string, addEdge edgeAdder) {
	metadata, _ := doc["metadata"].(map[string]interface{})
	if metadata == nil {
		return
	}
	owners, _ := metadata["ownerReferences"].([]interface{})
	for _, o := range owners {
		ref, ok := o.(map[string]interface{})
		if !ok {
			continue
		}
		kind, _ := ref["kind"].(string)
		name, _ := ref["name"].(string)
		if kind != "" && name != "" {
			addEdge(srcID, kind, name, "ownerRef")
		}
	}
}

func collectRefFields(doc map[string]interface{}, srcID string, addEdge edgeAdder) {
	for key, value := range doc {
		if key == "metadata" {
			continue
		}
		collectRefFieldsRecursive(value, srcID, addEdge)
	}
}

func collectRefFieldsRecursive(obj interface{}, srcID string, addEdge edgeAdder) {
	switch v := obj.(type) {
	case map[string]interface{}:
		for key, value := range v {
			if strings.HasSuffix(key, "Ref") || strings.HasSuffix(key, "Reference") {
				tryAddRef(value, srcID, addEdge)
			} else {
				collectRefFieldsRecursive(value, srcID, addEdge)
			}
		}
	case []interface{}:
		for _, item := range v {
			collectRefFieldsRecursive(item, srcID, addEdge)
		}
	}
}

func tryAddRef(value interface{}, srcID string, addEdge edgeAdder) {
	switch v := value.(type) {
	case map[string]interface{}:
		kind, _ := v["kind"].(string)
		name, _ := v["name"].(string)
		if kind != "" && name != "" {
			addEdge(srcID, kind, name, "fieldRef")
		}
	case []interface{}:
		for _, item := range v {
			if ref, ok := item.(map[string]interface{}); ok {
				kind, _ := ref["kind"].(string)
				name, _ := ref["name"].(string)
				if kind != "" && name != "" {
					addEdge(srcID, kind, name, "fieldRef")
				}
			}
		}
	}
}

func extractVolumes(podSpec map[string]interface{}, srcID string, addEdge edgeAdder) {
	volumes, _ := podSpec["volumes"].([]interface{})
	for _, vol := range volumes {
		v, ok := vol.(map[string]interface{})
		if !ok {
			continue
		}
		extractVolumeSource(v, srcID, addEdge)
	}
}

func extractVolumeSource(v map[string]interface{}, srcID string, addEdge edgeAdder) {
	if cm, ok := v["configMap"].(map[string]interface{}); ok {
		if name, _ := cm["name"].(string); name != "" {
			addEdge(srcID, "ConfigMap", name, "volume")
		}
	}
	if sec, ok := v["secret"].(map[string]interface{}); ok {
		if name, _ := sec["secretName"].(string); name != "" {
			addEdge(srcID, "Secret", name, "volume")
		}
	}
	if pvc, ok := v["persistentVolumeClaim"].(map[string]interface{}); ok {
		if name, _ := pvc["claimName"].(string); name != "" {
			addEdge(srcID, "PersistentVolumeClaim", name, "volume")
		}
	}
	if proj, ok := v["projected"].(map[string]interface{}); ok {
		extractProjectedSources(proj, srcID, addEdge)
	}
}

func extractProjectedSources(proj map[string]interface{}, srcID string, addEdge edgeAdder) {
	sources, _ := proj["sources"].([]interface{})
	for _, s := range sources {
		src, ok := s.(map[string]interface{})
		if !ok {
			continue
		}
		if cm, ok := src["configMap"].(map[string]interface{}); ok {
			if name, _ := cm["name"].(string); name != "" {
				addEdge(srcID, "ConfigMap", name, "volume")
			}
		}
		if sec, ok := src["secret"].(map[string]interface{}); ok {
			if name, _ := sec["name"].(string); name != "" {
				addEdge(srcID, "Secret", name, "volume")
			}
		}
	}
}

func extractEnvRefs(podSpec map[string]interface{}, srcID string, addEdge edgeAdder) {
	containers, _ := podSpec["containers"].([]interface{})
	initContainers, _ := podSpec["initContainers"].([]interface{})
	allContainers := append(containers, initContainers...)

	for _, c := range allContainers {
		cMap, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		extractContainerEnvRefs(cMap, srcID, addEdge)
	}
}

func extractContainerEnvRefs(cMap map[string]interface{}, srcID string, addEdge edgeAdder) {
	envFrom, _ := cMap["envFrom"].([]interface{})
	for _, ef := range envFrom {
		e, ok := ef.(map[string]interface{})
		if !ok {
			continue
		}
		if cmRef, ok := e["configMapRef"].(map[string]interface{}); ok {
			if name, _ := cmRef["name"].(string); name != "" {
				addEdge(srcID, "ConfigMap", name, "envRef")
			}
		}
		if secRef, ok := e["secretRef"].(map[string]interface{}); ok {
			if name, _ := secRef["name"].(string); name != "" {
				addEdge(srcID, "Secret", name, "envRef")
			}
		}
	}
	extractEnvValueFromRefs(cMap, srcID, addEdge)
}

func extractEnvValueFromRefs(cMap map[string]interface{}, srcID string, addEdge edgeAdder) {
	envVars, _ := cMap["env"].([]interface{})
	for _, ev := range envVars {
		envVar, ok := ev.(map[string]interface{})
		if !ok {
			continue
		}
		valueFrom, _ := envVar["valueFrom"].(map[string]interface{})
		if valueFrom == nil {
			continue
		}
		if cmKeyRef, ok := valueFrom["configMapKeyRef"].(map[string]interface{}); ok {
			if name, _ := cmKeyRef["name"].(string); name != "" {
				addEdge(srcID, "ConfigMap", name, "envRef")
			}
		}
		if secKeyRef, ok := valueFrom["secretKeyRef"].(map[string]interface{}); ok {
			if name, _ := secKeyRef["name"].(string); name != "" {
				addEdge(srcID, "Secret", name, "envRef")
			}
		}
	}
}

func extractServiceAccount(podSpec map[string]interface{}, srcID string, addEdge edgeAdder) {
	if sa, _ := podSpec["serviceAccountName"].(string); sa != "" && sa != "default" {
		addEdge(srcID, "ServiceAccount", sa, "serviceAccount")
	}
}

func extractServiceSelector(doc map[string]interface{}, srcID string, workloads []workloadLabels, addEdge edgeAdder) {
	spec, _ := doc["spec"].(map[string]interface{})
	if spec == nil {
		return
	}
	selector, _ := spec["selector"].(map[string]interface{})
	if len(selector) == 0 {
		return
	}
	for _, wl := range workloads {
		if labelsMatch(selector, wl.labels) {
			parts := strings.SplitN(wl.id, "/", 2)
			if len(parts) == 2 {
				addEdge(srcID, parts[0], parts[1], "selector")
			}
		}
	}
}

func extractIngressBackends(doc map[string]interface{}, srcID string, addEdge edgeAdder) {
	spec, _ := doc["spec"].(map[string]interface{})
	if spec == nil {
		return
	}

	if backend, ok := spec["defaultBackend"].(map[string]interface{}); ok {
		addIngressServiceRef(backend, srcID, addEdge)
	}

	extractIngressRules(spec, srcID, addEdge)
	extractIngressTLS(spec, srcID, addEdge)
}

func extractIngressRules(spec map[string]interface{}, srcID string, addEdge edgeAdder) {
	rules, _ := spec["rules"].([]interface{})
	for _, r := range rules {
		rule, ok := r.(map[string]interface{})
		if !ok {
			continue
		}
		httpSection, _ := rule["http"].(map[string]interface{})
		if httpSection == nil {
			continue
		}
		paths, _ := httpSection["paths"].([]interface{})
		for _, p := range paths {
			path, ok := p.(map[string]interface{})
			if !ok {
				continue
			}
			if backend, ok := path["backend"].(map[string]interface{}); ok {
				addIngressServiceRef(backend, srcID, addEdge)
			}
		}
	}
}

func extractIngressTLS(spec map[string]interface{}, srcID string, addEdge edgeAdder) {
	tls, _ := spec["tls"].([]interface{})
	for _, t := range tls {
		tlsEntry, ok := t.(map[string]interface{})
		if !ok {
			continue
		}
		if secretName, _ := tlsEntry["secretName"].(string); secretName != "" {
			addEdge(srcID, "Secret", secretName, "tlsSecret")
		}
	}
}

func addIngressServiceRef(backend map[string]interface{}, srcID string, addEdge edgeAdder) {
	if svc, ok := backend["service"].(map[string]interface{}); ok {
		if name, _ := svc["name"].(string); name != "" {
			addEdge(srcID, "Service", name, "ingressBackend")
		}
	}
	if name, _ := backend["serviceName"].(string); name != "" {
		addEdge(srcID, "Service", name, "ingressBackend")
	}
}

func extractRoleBindingRefs(doc map[string]interface{}, srcID string, addEdge edgeAdder) {
	if roleRef, ok := doc["roleRef"].(map[string]interface{}); ok {
		kind, _ := roleRef["kind"].(string)
		name, _ := roleRef["name"].(string)
		if kind != "" && name != "" {
			addEdge(srcID, kind, name, "roleBinding")
		}
	}
	subjects, _ := doc["subjects"].([]interface{})
	for _, s := range subjects {
		subj, ok := s.(map[string]interface{})
		if !ok {
			continue
		}
		kind, _ := subj["kind"].(string)
		name, _ := subj["name"].(string)
		if kind != "" && name != "" {
			addEdge(srcID, kind, name, "roleBinding")
		}
	}
}

func labelsMatch(selector, labels map[string]interface{}) bool {
	for k, v := range selector {
		if labels[k] != v {
			return false
		}
	}
	return true
}

func deduplicateEdges(edges []RelationEdge) []RelationEdge {
	seen := map[string]bool{}
	var result []RelationEdge
	for _, e := range edges {
		key := fmt.Sprintf("%s->%s:%s", e.Source, e.Target, e.Type)
		if !seen[key] {
			seen[key] = true
			result = append(result, e)
		}
	}
	return result
}
