package handlers

import (
	"github.com/joomcode/errorx"
	"k8s.io/apimachinery/pkg/api/errors"
	"net/http"

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
	// custom logic to provide most meaningful status for the resource
	if res.Status.Phase == "Active" || res.Status.Phase == "Error" {
		_ = res.Name + ""
	} else if res.Status.Phase == "" && len(res.Status.Conditions) > 0 {
		res.Status.Phase = v12.CarpPhase(res.Status.Conditions[len(res.Status.Conditions)-1].Type)
		res.Status.Message = res.Status.Conditions[len(res.Status.Conditions)-1].Message
		res.Status.Reason = res.Status.Conditions[len(res.Status.Conditions)-1].Reason
		if res.Status.Conditions[len(res.Status.Conditions)-1].Status == "False" {
			res.Status.Phase = "Not" + res.Status.Phase
		}
	} else if res.Status.Phase == "" {
		res.Status.Phase = "Exists"
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
