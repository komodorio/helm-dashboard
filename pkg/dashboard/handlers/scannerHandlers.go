package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type ScannersHandler struct {
	Data *DataLayer
}

func (h *ScannersHandler) List(context *gin.Context) {
	res := []string{}
	for _, scanner := range h.Data.Scanners {
		res = append(res, scanner.Name())
	}
	context.JSON(http.StatusOK, res)
}
