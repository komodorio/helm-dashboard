package subproc

type Scanner interface {
	Name() string                                                           // returns string label for the scanner
	Test() bool                                                             // test if the scanner is available
	ScanManifests(mnf string) (*ScanResults, error)                         // run the scanner on manifests
	ScanResource(ns string, kind string, name string) (*ScanResults, error) // run the scanner on k8s resource
}

type ScanResults struct {
	PassedCount int
	FailedCount int
	OrigReport  interface{}
	Error       error
}
