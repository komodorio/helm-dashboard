# Helm dashboard React

Welcome to the frontend of the helm dashboard.
We care most about keeping the project:
1. Maintainable
2. Extendable
3. Contributor friendly

# The FE Stack

- Vite, as our build tool.
- React, as our UI library.
- TypeScript and ESLint will keep the project safe, please keep them clean.
- Tailwind for styling.
- React-Query for fetching data from the backend.
- Storybook is utilized to develop a component library.

Please follow through the file structure to understand how things are structured and should be used.

# Contribution guide

## Setting up your development environment

1. First you should fork this repository.
2. Clone your new repository using `git clone <https_or_ssh_url>`.

## Running helm dashboard

1. Make sure you cloned the project correctly. This is explained in this [stage](https://github.com/komodorio/helm-dashboard/blob/helm-dashboard-v2/dashboard/README.md#setting-up-your-development-environment).
2. run the backend server. This is also explained in the above link.
2. go to `frontend` in your local project.
3. in order to install dependencies and start the development server
   - `npm i`
   - `npm run dev`
4. with the default integration the dashboard should run on http://localhost:5173/


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
