package scanners

type Scanner interface {
	Test() bool
	Run()
}
