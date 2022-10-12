package subproc

import "github.com/komodorio/helm-dashboard/pkg/dashboard/utils"

type Scanner interface {
	Name() string                                   // returns string label for the scanner
	Test() bool                                     // test if the scanner is available
	Run(qp *utils.QueryProps) (*ScanResults, error) // run the scanner
}

type ScanResults struct {
	PassedCount int
	FailedCount int
	OrigReport  interface{}
	Error       error
}
