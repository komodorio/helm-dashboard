package dashboard

import (
	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1"
	v12 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"net/http"
)

type KubeHandler struct {
	Data *DataLayer
}

func (h *KubeHandler) GetContexts(c *gin.Context) {
	res, err := h.Data.ListContexts()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.IndentedJSON(http.StatusOK, res)
}

func (h *KubeHandler) GetResourceInfo(c *gin.Context) {
	qp, err := getQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	res, err := h.Data.GetResource(qp.Namespace, &GenericResource{
		TypeMeta:   v1.TypeMeta{Kind: c.Param("kind")},
		ObjectMeta: v1.ObjectMeta{Name: qp.Name},
	})
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

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

	c.IndentedJSON(http.StatusOK, res)
}

func (h *KubeHandler) Describe(c *gin.Context) {
	qp, err := getQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	res, err := h.Data.DescribeResource(qp.Namespace, c.Param("kind"), qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.String(http.StatusOK, res)
}
