package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"k8s.io/apimachinery/pkg/api/errors"
	v12 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"k8s.io/utils/strings/slices"
)

const Unknown = "Unknown"
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

	res.Status = *EnhanceStatus(res, nil)

	c.IndentedJSON(http.StatusOK, res)
}

func EnhanceStatus(res *v12.Carp, err error) *v12.CarpStatus {
	s := res.Status
	if s.Conditions == nil {
		s.Conditions = []v12.CarpCondition{}
	}

	c := v12.CarpCondition{
		Type:    "hdHealth",
		Status:  Unknown,
		Reason:  s.Reason,
		Message: s.Message,
	}

	// custom logic to provide most meaningful status for the resource
	if err != nil {
		c.Reason = "ErrorGettingStatus"
		c.Message = err.Error()
	} else if s.Phase == "Error" {
		c.Status = Unhealthy
	} else if slices.Contains([]string{"Available", "Active", "Established", "Bound", "Ready"}, string(s.Phase)) {
		c.Status = Healthy
		c.Reason = "Exists" //since there is no condition to check here, we can set reason as exists.
	} else if s.Phase == "" && len(s.Conditions) > 0 {
		applyCustomConditions(&s, &c)
	} else if s.Phase == "Pending" {
		c.Status = Progressing
		c.Reason = string(s.Phase)
	} else if s.Phase == "" {
		c.Status = Healthy
		c.Reason = "Exists"
	} else {
		log.Warnf("Unhandled status: %v", s)
		c.Reason = string(s.Phase)
	}

	s.Conditions = append(s.Conditions, c)
	return &s
}

func applyCustomConditions(s *v12.CarpStatus, c *v12.CarpCondition) {
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
		} else if cond.Type == "Available" && c.Status == Unknown {
			if cond.Status == "False" {
				c.Status = Unhealthy
			} else {
				c.Status = Healthy
			}
			c.Reason = cond.Reason
			c.Message = cond.Message
		} else if cond.Type == "DisruptionAllowed" && c.Status == Unknown { //condition for PodDisruptionBudget
			if cond.Status == "False" {
				c.Status = Unhealthy
			} else {
				c.Status = Healthy
			}
			c.Reason = cond.Reason
			c.Message = cond.Message
		} else if (cond.Type == "Established" || cond.Type == "NamesAccepted") && (c.Status == Unknown || c.Status == Healthy) { //condition for CRD
			if cond.Status == "False" {
				c.Status = Unhealthy
			} else {
				c.Status = Healthy
			}
			c.Reason = cond.Reason
			c.Message = cond.Message
		}
	}
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
