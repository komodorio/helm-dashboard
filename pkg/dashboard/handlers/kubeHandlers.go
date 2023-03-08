package handlers

import (
	"github.com/google/martian/log"
	"github.com/joomcode/errorx"
	"k8s.io/apimachinery/pkg/api/errors"
	"net/http"
	"sort"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	v12 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
)

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

func EnhanceStatus(res *v12.Carp) {
	s := res.Status
	if s.Conditions == nil {
		s.Conditions = []v12.CarpCondition{}
	}

	c := v12.CarpCondition{
		Type:    "hdHealth",
		Status:  "Healthy",
		Reason:  s.Reason,
		Message: s.Message,
	}
	const unhealthy = "Unhealthy"

	// custom logic to provide most meaningful status for the resource
	if s.Phase == "Error" {
		c.Status = unhealthy
	} else if s.Phase == "" && len(s.Conditions) > 0 {
		sort.SliceStable(s.Conditions, func(i, j int) bool {
			return s.Conditions[i].LastTransitionTime.Before(&s.Conditions[j].LastTransitionTime)
		})

		last := s.Conditions[len(s.Conditions)-1]
		c.Reason = string(last.Type)
		c.Message = last.Message
		if last.Status == "False" {
			c.Status = unhealthy
		}
	} else if s.Phase == "" {
		c.Reason = "Exists"
	} else {
		log.Debugf("Something else")
	}

	s.Conditions = append(s.Conditions, c)
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
