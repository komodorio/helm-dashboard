# Shutting down the app
To close Helm-dashboard, click on the button in the rightmost corner of the screen. Once you click on it, your Helm-dashboard will be shut down.

![Shutdown_screenshot](images/screenshot_shut_down.png)

# Multicluster
If you want to switch to a different cluster, simply click on the corresponding cluster as shown in the figure. [Click here](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/) to learn how to access multiple clusters.
![Multicluster_screenshot](images/screenshot_multicluster.png)

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
This tells us which chart version we are using.
![Releases1](images/screenshot_release.png)

A revision is linked to a release to track the number of updates/changes that release encounters.
![Releases2](images/screenshot_release2.png)
 
Namespaces are a way to organize clusters into virtual sub-clusters — they can be helpful when different teams or projects share a Kubernetes cluster. Any number of namespaces are supported within a cluster, each logically separated from others but with the ability to communicate with each other.
![Releases3](images/screenshot_release3.png)

This indicates the time when your chart was last updated.
![Releases4](images/screenshot_release4.png)