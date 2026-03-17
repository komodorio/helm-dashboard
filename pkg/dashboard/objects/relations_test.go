package objects

import (
	"testing"
)

const testManifest = `
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  key: value
---
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
data:
  password: cGFzcw==
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-sa
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      serviceAccountName: my-sa
      containers:
      - name: main
        image: nginx:latest
        envFrom:
        - configMapRef:
            name: my-config
        env:
        - name: DB_PASS
          valueFrom:
            secretKeyRef:
              name: my-secret
              key: password
      volumes:
      - name: config-vol
        configMap:
          name: my-config
      - name: secret-vol
        secret:
          secretName: external-secret
---
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
  tls:
  - secretName: tls-cert
    hosts:
    - example.com
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: my-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: my-role
subjects:
- kind: ServiceAccount
  name: my-sa
  namespace: default
`

func TestExtractRelations(t *testing.T) {
	graph := ExtractRelations(testManifest)

	// Check nodes
	nodeMap := map[string]RelationNode{}
	for _, n := range graph.Nodes {
		nodeMap[n.ID] = n
	}

	// In-release nodes
	inReleaseExpected := []string{
		"ConfigMap/my-config",
		"Secret/my-secret",
		"ServiceAccount/my-sa",
		"Deployment/my-app",
		"Service/my-service",
		"Ingress/my-ingress",
		"ClusterRoleBinding/my-binding",
	}
	for _, id := range inReleaseExpected {
		n, ok := nodeMap[id]
		if !ok {
			t.Errorf("missing in-release node %s", id)
			continue
		}
		if !n.InRelease {
			t.Errorf("node %s should be inRelease=true", id)
		}
	}

	// Ghost nodes (external references)
	ghostExpected := []string{
		"Secret/external-secret",
		"Secret/tls-cert",
		"ClusterRole/my-role",
	}
	for _, id := range ghostExpected {
		n, ok := nodeMap[id]
		if !ok {
			t.Errorf("missing ghost node %s", id)
			continue
		}
		if n.InRelease {
			t.Errorf("node %s should be inRelease=false", id)
		}
	}

	// Check edges
	edgeSet := map[string]bool{}
	for _, e := range graph.Edges {
		key := e.Source + " -" + e.Type + "-> " + e.Target
		edgeSet[key] = true
	}

	expectedEdges := []string{
		"Deployment/my-app -volume-> ConfigMap/my-config",
		"Deployment/my-app -volume-> Secret/external-secret",
		"Deployment/my-app -envRef-> ConfigMap/my-config",
		"Deployment/my-app -envRef-> Secret/my-secret",
		"Deployment/my-app -serviceAccount-> ServiceAccount/my-sa",
		"Service/my-service -selector-> Deployment/my-app",
		"Ingress/my-ingress -ingressBackend-> Service/my-service",
		"Ingress/my-ingress -tlsSecret-> Secret/tls-cert",
		"ClusterRoleBinding/my-binding -roleBinding-> ClusterRole/my-role",
		"ClusterRoleBinding/my-binding -roleBinding-> ServiceAccount/my-sa",
	}
	for _, e := range expectedEdges {
		if !edgeSet[e] {
			t.Errorf("missing edge: %s", e)
		}
	}

	t.Logf("Nodes: %d, Edges: %d", len(graph.Nodes), len(graph.Edges))
	for _, e := range graph.Edges {
		t.Logf("  %s --%s--> %s", e.Source, e.Type, e.Target)
	}
}
