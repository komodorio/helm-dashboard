package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"k8s.io/apimachinery/pkg/api/errors"
	v12 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"k8s.io/utils/strings/slices"
	"net/http"
)

const Healthy = "Healthy"
const Unhealthy = "Unhealthy"
const Progressing = "Progressing"

type KubeHandler struct {
	*Contexted
}

func (h *KubeHandler) GetContexts(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	res, err := h.Data.ListContexts()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.IndentedJSON(http.StatusOK, res)
}

func (h *KubeHandler) GetResourceInfo(c *gin.Context) {
	qp, err := utils.GetQueryProps(c)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	res, err := app.K8s.GetResourceInfo(c.Param("kind"), qp.Namespace, qp.Name)
	if errors.IsNotFound(err) {
		res = &v12.Carp{Status: v12.CarpStatus{Phase: "NotFound", Message: err.Error()}}
		//_ = c.AbortWithError(http.StatusNotFound, err)
		//return
	} else if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	EnhanceStatus(res)

	c.IndentedJSON(http.StatusOK, res)
}

func EnhanceStatus(res *v12.Carp) *v12.CarpStatus {
	s := res.Status
	if s.Conditions == nil {
		s.Conditions = []v12.CarpCondition{}
	}

	c := v12.CarpCondition{
		Type:    "hdHealth",
		Status:  Healthy,
		Reason:  s.Reason,
		Message: s.Message,
	}

	// custom logic to provide most meaningful status for the resource
	if s.Phase == "Error" {
		c.Status = Unhealthy
	} else if slices.Contains([]string{"Available", "Active", "Established", "Bound", "Ready"}, string(s.Phase)) {
		// all good
	} else if s.Phase == "" && len(s.Conditions) > 0 {
		for _, cond := range s.Conditions {
			if cond.Type == "Progressing" { // https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
				if cond.Status == "False" {
					c.Status = Unhealthy
					c.Reason = cond.Reason
					c.Message = cond.Message
				} else if cond.Reason != "NewReplicaSetAvailable" {
					c.Status = Progressing
					c.Reason = cond.Reason
					c.Message = cond.Message
				}
			}
		}
	} else if s.Phase == "" {
		c.Reason = "Exists"
	} else {
		log.Debugf("Something else")
	}

	s.Conditions = append(s.Conditions, c)
	return &s
}

func (h *KubeHandler) Describe(c *gin.Context) {
	qp, err := utils.GetQueryProps(c)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	res, err := app.K8s.DescribeResource(c.Param("kind"), qp.Namespace, qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.String(http.StatusOK, res)
}

func (h *KubeHandler) GetNameSpaces(c *gin.Context) {
	if c.Param("kind") != "namespaces" {
		_ = c.AbortWithError(http.StatusBadRequest, errorx.AssertionFailed.New("Only 'namespaces' kind is allowed for listing"))
		return
	}

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	res, err := app.K8s.GetNameSpaces()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.IndentedJSON(http.StatusOK, res)
}
