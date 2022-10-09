package scanners

type Scanner interface {
	Name() string               // returns string label for the scanner
	Test() bool                 // test if the scanner is available
	Run(manifests string) error // run the scanner
}
