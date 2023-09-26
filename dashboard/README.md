# Helm dashboard V2

Welcome to our new project, upgrading helm dashbord, we call it, Helm Dashboard version... 2! 🤩

Helm dashboard V2 is an open source effort to modernize the helm-dashboard.
Our goals are to create a version which is more:

1. Maintable
2. Extendable
3. Contributor friendly

## What is helm?

First thing first, if you are new here please check out these resources to see what helm is all about
[Video](https://www.youtube.com/watch?v=fy8SHvNZGeE)
[Article](https://kruschecompany.com/helm-kubernetes/)

# Legacy dashboard vs dashboard V2

The legacy dashboard found [here](https://github.com/komodorio/helm-dashboard/tree/main/pkg/dashboard/static) is a static webapp and was written vanilla css, jquery, javascript and html. If you inspect the code abit you may notice that its relitvly hard to extend and maintain such a project.

Our goal with dashboard V2 is to improve the ability to maintain and extend our dashboard app. To achive this we are using a more modern frontend stack.

- Vite, as our build tool.
- React will be used to make this project more inviting for developers to contribute too.
- TypeScript and ESLint will keep the project safe, please keep them clean.
- Tailwind will be used for styling.
- React-Query will be used to fetch data from the backend.
- Storybook is utilized to develop a component library.

Please follow through the file structure to understand how things are structured and should be used.

# Contribution guide

## Running legacy dashboard

The legacy dashboard is great for refrence and checking that you have implemented the UI correctly.

1. Install [helm](https://helm.sh/docs/intro/install/) and [kubectl](https://kubernetes.io/docs/tasks/tools/).
2. `git clone https://github.com/komodorio/helm-dashboard.git`.
3. `go build -o bin/dashboard .`
4. `bin/dashboard`

The UI should now be running on http://localhost:8080/
If you're having issues with that please follow the main README in the main folder.
If you still having troubles please contact us on our [Slack community channel](https://join.slack.com/t/komodorkommunity/shared_invite/zt-1lz4cme86-2zIKTRtTFnzL_UNxaUS9yw)

## Setting up your development environment

1. First you should fork this repositroy.
2. Clone your new repository using `git clone <https_or_ssh_url>`.
3. Make sure to checkout branch `helm-dashboard-v2`.
   - `git fetch`
   - `git checkout helm-dashboard-v2`

## Running dashboard V2

1. Make sure you cloned the project correctly. This is explained in this [stage](https://github.com/komodorio/helm-dashboard/blob/helm-dashboard-v2/dashboard/README.md#setting-up-your-development-environment).
2. go to `helm-dashboard-v2/dashboard` in your local project.
3. inorder to install dependncies and start the development server
   - `npm i`
   - `npm run dev`
4. with the default integration the dashboard should run on http://localhost:5173/

## Setting up a local cluster with ease

1. Install [Docker](https://docs.docker.com/engine/install/ubuntu/)
2. Install [Minikube](https://minikube.sigs.k8s.io/docs/start/)
3. Start your cluster `minikube start`

You should now be able to follow the [Helm tutorial](https://helm.sh/docs/intro/quickstart/) and interact with Helm normally.

## Choosing a task

If you are completely new to the project its recommended to look for tasks labled: `good first issue`.
These tasks should be simple enough for a begginer or for someone looking to learn the code base.

You are also free to reachout to us on [Slack](https://join.slack.com/t/komodorkommunity/shared_invite/zt-1lz4cme86-2zIKTRtTFnzL_UNxaUS9yw), we can help you find a task that suits your perfectly.

## Opening a pull request

Inorder to open a pull request with your changes. \

1.  make sure you are synced with `helm-dashboard-v2` and that all conflicts are resolved. \
2.  commit your changes and push to your fork. \
3.  then navigate to https://github.com/komodorio/helm-dashboard and open a pull request. Make sure you are merging from your branch to `helm-dashboard-v2`. \
4.  you should now tag a main developer (@chad11111
    for example) and get your pull request reviewed.

# Component library

We created a components library to have a consistent design system throughout the project. Please rely on these components.
Additional information and examples on how to use them are available when you run Storybook, which shows them in an interactive way and in different scenarios.

Once you run it, you'll be able to see pre-made scenarios, documentation, and play with the component properties.

To run Storybook, make sure that all the dependencies are installed and run:

```shell
npm run storybook
```

Refer to the [official documentation](https://storybook.js.org/docs/react/get-started/install) for more information.

# Helpers

- Icons: https://react-icons.github.io/react-icons/
- Tailwind: https://tailwindcss.com/docs
- Typescript: https://www.typescriptlang.org/docs/handbook/intro.html
- React-query: https://react-query.tanstack.com/overview

# Coding Conventions

- Use only functional components
- Please prefer async/await over .then
- wrap every function with try/catch unless you want to display the error to the user
  in such case we have a general error handler in the app.tsx file which will display the error to the user in a modal
- Please use the component library we created, it will help us keep a consistent design system
- Please use the react-query library to fetch data from the backend
- Prefer use fetch API over axios, if you see axios in the code, replace it with fetch.
- Use <Outlet> for inner routes
- User query params in the url for filters or any other state that can be represented
- Hooks:
  - useCustomSearchParams - for search params
