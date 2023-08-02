import { useParams } from "react-router-dom"
import useAlertError from "../../../hooks/useAlertError"
import { useCallback, useEffect, useMemo, useState } from "react"
import { callApi, useGetVersions } from "../../../API/releases"
import Modal, { ModalButtonStyle } from "../Modal"
import { GeneralDetails } from "./GeneralDetails"
import { UserDefinedValues } from "./UserDefinedValues"
import { ChartValues } from "./ChartValues"
import { ManifestDiff } from "./ManifestDiff"
import { useMutation } from "@tanstack/react-query"
import { useChartRepoValues } from "../../../API/repositories"
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams"
import { VersionToInstall } from "./VersionToInstall"
import apiService from "../../../API/apiService"
import { isNewerVersion, isNoneEmptyArray } from "../../../utils"
import useCustomSearchParams from "../../../hooks/useCustomSearchParams"

interface InstallRepoChartModalProps {
  isOpen: boolean
  onClose: () => void
  chartName: string
  currentlyInstalledChartVersion?: string
  latestVersion?: string
  isUpgrade?: boolean
  latestRevision?: number
}

const getVersionManifestFormData = ({
  version,
  userValues,
  chart,
  chartName,
}: {
  version: string
  userValues?: string
  chart: string
  releaseValues?: string
  chartName: string
}) => {
  const formData = new FormData()
  // preview needs to come first, for some reason it has a meaning at the backend
  formData.append("preview", "true")
  formData.append("chart", chart)
  formData.append("version", version)
  formData.append("values", userValues || "")
  formData.append("name", chartName)

  return formData
}

export const InstallRepoChartModal = ({
  isOpen,
  onClose,
  chartName,
  currentlyInstalledChartVersion,
  latestVersion,
}: InstallRepoChartModalProps) => {
  const navigate = useNavigateWithSearchParams()
  const { setShowErrorModal } = useAlertError()
  const [userValues, setUserValues] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoadingDiff, setIsLoadingDiff] = useState(false)
  const [diff, setDiff] = useState("")

  const { context: selectedCluster, selectedRepo: currentRepoCtx } = useParams()
  const { searchParamsObject } = useCustomSearchParams()
  const { filteredNamespace } = searchParamsObject
  const [namespace, setNamespace] = useState(
    filteredNamespace !== "default" ? filteredNamespace : undefined
  )
  const [releaseName, setReleaseName] = useState(chartName)

  const { error: versionsError, data: _versions } = useGetVersions(chartName, {
    select: (data) => {
      return data?.sort((a, b) =>
        isNewerVersion(a.version, b.version) ? 1 : -1
      )
    },
    onSuccess: (data) => {
      const empty = { version: "", repository: "", urls: [] }
      const versionsToRepo = data.filter((v) => v.repository === currentRepoCtx)
      return setSelectedVersionData(versionsToRepo[0] ?? empty)
    },
  })

  const versions = _versions?.map((v) => ({
    ...v,
    isChartVersion: v.version === currentlyInstalledChartVersion,
  }))

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  latestVersion = latestVersion ?? currentlyInstalledChartVersion // a guard for typescript, latestVersion is always defined
  const [selectedVersionData, setSelectedVersionData] = useState<{
    version: string
    repository?: string
    urls: string[]
  }>()

  const selectedVersion = useMemo(() => {
    return selectedVersionData?.version
  }, [selectedVersionData])

  const selectedRepo = useMemo(() => {
    return selectedVersionData?.repository
  }, [selectedVersionData])

  const chart = useMemo(() => {
    return selectedVersionData?.urls?.[0]?.startsWith("file://")
      ? selectedVersionData?.urls[0]
      : `${selectedVersionData?.repository}/${chartName}`
  }, [selectedVersionData, chartName])

  const fetchDiffBody = useMemo(() => {
    return {
      userValues,
      selectedVersion,
      selectedRepo,
      currentlyInstalledChartVersion,
      versionsError,
    }
  }, [
    currentlyInstalledChartVersion,
    selectedRepo,
    selectedVersion,
    userValues,
    versionsError,
  ])

  const { data: chartValues, isLoading: loadingChartValues } =
    useChartRepoValues(namespace || "default", selectedVersion || "", chart, {
      queryKey: [
        "chartValues",
        namespace,
        selectedVersion,
        chart,
        selectedRepo,
      ],
      enabled: Boolean(selectedRepo) && selectedRepo !== "",
    })

  // Confirm method (install)
  const setReleaseVersionMutation = useMutation(
    [
      "setVersion",
      namespace,
      releaseName,
      selectedVersion,
      selectedRepo,
      selectedCluster,
      chart,
    ],
    async () => {
      setErrorMessage("")
      const formData = new FormData()
      formData.append("preview", "false")
      formData.append("chart", chart)
      formData.append("version", selectedVersion || "")
      formData.append("values", userValues)
      formData.append("name", releaseName || "")
      const res = await fetch(
        // Todo: Change to BASE_URL from env
        `/api/helm/releases/${namespace ? namespace : "default"}`,
        {
          method: "post",
          body: formData,
          headers: {
            "X-Kubecontext": selectedCluster as string,
          },
        }
      )

      if (!res.ok) {
        setShowErrorModal({
          title: `Failed to install" the chart`,
          msg: String(await res.text()),
        })
      }

      return res.json()
    },
    {
      onSuccess: async (response) => {
        onClose()
        navigate(
          `/${selectedCluster}/${response.namespace}/${response.name}/installed/revision/1`
        )
      },
      onError: (error) => {
        setErrorMessage((error as Error)?.message || "Failed to update")
      },
    }
  )

  // It actually fetches the manifest for the diffs
  const fetchVersionData = useCallback(
    async ({
      version,
      userValues,
    }: {
      version: string
      userValues?: string
    }) => {
      const formData = getVersionManifestFormData({
        version,
        userValues,
        chart,
        chartName,
      })
      const fetchUrl = `/api/helm/releases/${namespace || "default"}`
      try {
        setErrorMessage("")
        const data = await callApi(fetchUrl, {
          method: "post",
          body: formData,
        })
        return data
      } catch (e) {
        setErrorMessage((e as Error).message as string)
      }
    },
    [chart, chartName, namespace]
  )

  const fetchDiff = useCallback(
    async ({
      userValues,
      selectedRepo,
      selectedVersion = "",
      versionsError,
    }: {
      userValues?: string
      selectedRepo?: string
      selectedVersion?: string
      versionsError?: string
    }) => {
      if (!selectedRepo || versionsError) {
        return
      }
      setIsLoadingDiff(true)
      try {
        const [currentVerData] = await Promise.all([
          fetchVersionData({
            version: selectedVersion,
            userValues,
          }),
        ])
        const formData = new FormData()

        formData.append("a", "")
        formData.append("b", (currentVerData as any).manifest)

        const response = await apiService.fetchWithDefaults("/diff", {
          method: "post",
          body: formData,
        })
        const diff = await response.text()
        setDiff(diff)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoadingDiff(false)
      }
    },
    [fetchVersionData]
  )

  useEffect(() => {
    if (
      fetchDiffBody.selectedVersion &&
      fetchDiffBody.selectedRepo &&
      !loadingChartValues
    ) {
      fetchDiff(fetchDiffBody)
    }
  }, [fetchDiff, fetchDiffBody, loadingChartValues])

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedVersionData({ version: "", urls: [] })
        onClose()
      }}
      title={
        <div className="font-bold">
          Install <span className="text-green-700 ">{chartName}</span>
        </div>
      }
      containerClassNames="w-full text-2xl h-2/3"
      actions={[
        {
          id: "1",
          callback: setReleaseVersionMutation.mutate,
          variant: ModalButtonStyle.info,
          isLoading: setReleaseVersionMutation.isLoading,
          disabled:
            loadingChartValues ||
            isLoadingDiff ||
            setReleaseVersionMutation.isLoading,
        },
      ]}
    >
      {versions && isNoneEmptyArray(versions) && (
        <VersionToInstall
          versions={versions}
          initialVersion={selectedVersionData}
          onSelectVersion={setSelectedVersionData}
          showCurrentVersion={false}
        />
      )}

      <GeneralDetails
        releaseName={releaseName ?? ""}
        disabled={false}
        namespace={namespace}
        onReleaseNameInput={setReleaseName}
        onNamespaceInput={setNamespace}
      />
      <div className="flex w-full gap-6 mt-4">
        <UserDefinedValues initialValue={""} setValues={setUserValues} />

        <ChartValues chartValues={chartValues} loading={loadingChartValues} />
      </div>

      <ManifestDiff
        diff={diff}
        isLoading={isLoadingDiff || loadingChartValues}
        error={errorMessage || (versionsError as string)}
      />
    </Modal>
  )
}
