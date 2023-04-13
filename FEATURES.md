
# Helm-dashboard Overview 

Helm Dashboard is a web-based user interface that provides a graphical interface for managing Helm charts, releases, and repositories in Kubernetes. It simplifies the process of searching for charts, installing and managing releases, and managing chart repositories. The Helm Dashboard is designed to work with the Helm package manager and provides a simple and convenient way for users to manage the lifecycle of their applications and services. Overall, Helm Dashboard is a powerful tool that streamlines the deployment and management of applications and services in Kubernetes.

## Prerequisite Skills
To use Helm Dashboard, you need to have some basic knowledge of Kubernetes, Helm, and containers. This includes knowing how Kubernetes works, what pods, deployments, and services are, and how to use kubectl to interact with Kubernetes. You should also have some experience with YAML, a language used to write Kubernetes configuration files, and understand how web-based interfaces work. Overall, to use Helm Dashboard well, you should have a good understanding of Kubernetes, Helm, and containers.

## Dashboard Overview

The Helm dashboard provides an overview of all the charts installed on the Kubernetes cluster. It displays the status of the charts, including the number of releases, the version of the chart, the namespace, and the date of the last update.

## Shutting down the app

Open the Helm dashboard: This is a web page that you can open in your internet browser.

Find the app: Look for the app that you want to shut down in the list of installed apps on the Helm dashboard.

* Click on the app: Click on the name or icon of the app to see its details.

* Shut down the app: Look for a button that says "Uninstall" or "Delete" and click on it to shut down the app. This will remove the app and all its components from the Kubernetes cluster.

* Confirm the shutdown: You may see a message asking you to confirm that you want to shut down the app. Read it carefully before you click "OK".

* Check that the app is gone: Look for the name of the app in the list of installed apps in the Helm dashboard. If it's not there anymore, it means that you have successfully shut down the app.

* It's important to remember that shutting down an app using Helm will delete all of its components and data. So, make sure to back up any important data or configurations before you shut down an app.

## REST API

The Helm Dashboard provides a REST API that you can use to manage and interact with Helm charts and releases.

1. Base URL: The base URL for the REST API is typically the URL of the Helm Dashboard itself.

2. Endpoints: The REST API provides endpoints for various operations, such as managing Helm releases, managing Helm charts, and getting status information about the Kubernetes cluster. Examples of some of the endpoints are:

 * GET /api/releases: Retrieves a list of all releases installed in the cluster.
 * GET /api/charts: Retrieves a list of all charts available in the repository.
 * POST /api/releases: Installs a new release using a specified chart and configuration.
 * DELETE /api/releases/{release_name}: Deletes an existing release.

 3.  The endpoints in the REST API may accept various parameters, such as release names, chart names, and configuration values. These parameters are typically specified as query parameters or in the request body, depending on the endpoint.

4. Authentication: The REST API may require authentication to access certain endpoints, depending on the configuration of the Helm Dashboard. The API supports several authentication methods, including basic authentication and bearer tokens.

5. Response format: The REST API typically returns responses in JSON format, which can be easily parsed by client applications.








