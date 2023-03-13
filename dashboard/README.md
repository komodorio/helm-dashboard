# Helm dashboard V2
Helm dashboard V2 is an open source effort to modernize the helm-dashboard.
Our goals are to create a version of help more:
1. Maintable 
2. Extendable
3. Contributor friendly 


## What is helm?
[Video](https://www.youtube.com/watch?v=fy8SHvNZGeE)
[Article](https://kruschecompany.com/helm-kubernetes/)

# Legacy dashboard vs dashboard V2

The legacy dashboard found [here](https://github.com/komodorio/helm-dashboard/tree/main/pkg/dashboard/static) is a static webapp and was written vanilla css, jquery, javascript and html. If you inspect the code abit you may notice that its relitvly hard to extend and maintain such a project.

Our goal with dashboard V2 is to improve the ability to maintain and extend our dashboard app. To achive this we are using a more modern frontend stack.
- Vite, as our build tool.
- React will be used to make this project more inviting for developers to contribute too.
- Tailwind will be used for styling.
- Storybook is utilized to develop a component library.

# Contribution guide

## Running legacy dashboard
The legacy dashboard is great for refrence and checking that you have implemented the UI correctly.

1. Install [helm](https://helm.sh/docs/intro/install/) and [kubectl](https://kubernetes.io/docs/tasks/tools/).
2. `git clone https://github.com/komodorio/helm-dashboard.git`.
3. `go build -o bin/dashboard .`
4. `bin/dashboard`

The UI should now be running on http://localhost:8080/

## Setting up your development environment

1. First you should fork this repositroy.
2. Clone your new repository using `git clone <https_or_ssh_url>`.
3. Make sure to checkout branch `helm-dashboard-v2`.
    - `git fetch`
    - `git checkout helm-dashboard-v2`


## Running dashboard V2

1. first make sure you cloned the project correctly. This is explained in this [stage](https://github.com/komodorio/helm-dashboard/blob/helm-dashboard-v2/dashboard/README.md#setting-up-your-development-environment).
2. go to `helm-dashboard-v2/dashboard` in your local project.
3. inorder to install dependncies and start the development server
    - `npm i`
    - `npm start`
4. with the default integration the dashboard should run on http://localhost:3000/ 


## Choseing a task
If you are completely new to the project its recommended to look for tasks labled: `good first issue`.
These tasks should be simple enough for a begginer or for someone looking to learn the code base.

You are also free to reachout to us on [discord](https://discord.gg/udRezxKt), we can help you find a task that suits your perfectly.

## Opening a pull request
Inorder to open a pull request with your changes. \
    1. make sure you are synced with `helm-dashboard-v2` and that all conflicts are resolved. \
    2. commit your changes and push to your fork. \
    3. then navigate to https://github.com/komodorio/helm-dashboard and open a pull request. Make sure you are merging from your branch to `helm-dashboard-v2`. \
    4. you should now tag a main developer (@chad11111
 for example) and get your pull request reviewed.
