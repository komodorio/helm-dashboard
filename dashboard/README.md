# Helm dashboard V2
Helm dashboard V2 is an open source effort to modernize the helm-dashboard.
Our goals are to create a version of help more:
1. Maintable 
2. Extendable
3. Contributor friendly 


## What is helm?
[Video](https://www.youtube.com/watch?v=fy8SHvNZGeE)
[Article](https://kruschecompany.com/helm-kubernetes/)

# Contribution guide

## Running legacy dashboard
The legacy dashboard is great for refrence and checking that you have implemented the UI correctly.

1. Install [helm](https://helm.sh/docs/intro/install/) and [kubectl](https://kubernetes.io/docs/tasks/tools/).
2. `git clone https://github.com/komodorio/helm-dashboard.git`.
3. `go build -o bin/dashboard .`
4. `bin/dashboard`

The UI should now be running on http://localhost:8080/

## Setting up development enviorment

1. First you should fork this repositroy.
2. Clone your new repository using `git clone <https_or_ssh_url>`.
3. Make sure to checkout branch `helm-dashboard-v2`.
    - `git fetch`
    - `git checkout helm-dashboard-v2`


## Chooseing a task
TODO
## Opening a pull request
TODO
