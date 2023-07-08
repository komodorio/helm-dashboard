# Shutting down the app
To close Helm-dashboard, click on the button in the rightmost corner of the screen. Once you click on it, your Helm-dashboard will be shut down.

![Shutdown_screenshot](images/screenshot_shut_down.png)

# Multicluster
If you want to switch to a different cluster, simply click on the corresponding cluster as shown in the figure. [Click here](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/) to learn how to access multiple clusters.
![Multicluster_screenshot](images/screenshot_multicluster.png)

# Reset Cache
The "Reset Cache" feature in Helm Dashboard clears the cached data and fetches the latest information from the backend or data source. It ensures that the dashboard displays up-to-date data and reflects any recent changes or updates.
![Detail1](images/screenshot_reset_cache.png)

# Repository
Essentially, a repository is a location where charts are gathered and can be shared. If you want to learn more about repositories, [click here](https://helm.sh/docs/topics/chart_repository/). You can find the repository in the home section, as depicted in the figure.
![Repository3](images/screenshot_repository3.png)

You can add the repository by clicking on 'Add Repository', as shown in the figure.
![Repository](images/screenshot_repository.png)

After completing that step, enter the following data: the repository name and its URL. You can also add the username and password, although this is optional.
![Repository2](images/screenshot_repository2.png)

Updating means refreshing your repository. You can update your repository as shown in the figure.
![Repository4](images/screenshot_repository4.png)

If you want to remove your repository from the Helm dashboard, click on the 'Remove' button as shown in the figure.
![Repository5](images/screenshot_repository5.png)

Use the filter option to find the desired chart quicker from the list of charts.
![Repository6](images/screenshot_repository6.png)

If you want to install a particular chart, simply hover the pointer over the chart name and an 'Install' button will appear, as shown in the figure.
![Repository7](images/screenshot_repository7.png)

# Installed Releases list
A release is an instance of your selected chart running on your Kubernetes Cluster. That means every time that you install a Helm chart there, it creates a new release or instance that coexists with other releases without conflict. You can filter releases based on namespaces or search for release names 
![Releases](images/screenshot_release.png)

The squares represent k8s resources installed by the release. Hover over each square to view a tooltip with details. Yellow indicates "pending," green signifies a healthy state, and red indicates an unhealthy state.
![Releases1](images/screenshot_release1.png)

It indicates the version of chart that corresponds to this release.
![Releases2](images/screenshot_release2.png)

A revision is linked to a release to track the number of updates/changes that release encounters.
![Releases3](images/screenshot_release3.png)
 
Namespaces are a way to organize clusters into virtual sub-clusters — they can be helpful when different teams or projects share a Kubernetes cluster. Any number of namespaces are supported within a cluster, each logically separated from others but with the ability to communicate with each other.
![Releases4](images/screenshot_release4.png)

Updated" refers to the amount of time that has passed since the last revision of the release. Whenever you install or upgrade the release, a new revision is created. You can think of it as the "age" of the latest revision.
![Releases5](images/screenshot_release5.png)

Indication of upgrade possible/repo suggested.
![Release6](images/screenshot_upgrade_available.png)

# Release details
This indicates the status of the deployed release, and 'Age' represents the amount of time that has passed since the creation of the revision until now.
![Detail](images/screenshot_release_detail.png)

You can use the Upgrade/Downgrade button to switch to different release versions, as shown in the figure.
![Detail1](images/screenshot_upgrade_available2.png)

Confirm the upgrade settings and configuration and click on confirm button to continue
![Detail2](images/screenshot_upgrade_confirmation.png)

Once the upgrade is done, your release will show the status 
![Detail3](images/screenshot_upgrade_complete.png)

It executes the test scripts or commands within the deployed application's environment and displays the results
![Detail4](images/screenshot_run_tests.png)

Running test hooks results 
![Detail5](images/screenshot_test_results.png)





