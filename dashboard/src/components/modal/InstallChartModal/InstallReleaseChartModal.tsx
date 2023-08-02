import { useParams } from "react-router-dom"
import useAlertError from "../../../hooks/useAlertError"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  callApi,
  useChartReleaseValues,
  useGetVersions,
} from "../../../API/releases"
import Modal, { ModalButtonStyle } from "../Modal"
import { GeneralDetails } from "./GeneralDetails"
import { UserDefinedValues } from "./UserDefinedValues"
import { ChartValues } from "./ChartValues"
import { ManifestDiff } from "./ManifestDiff"
import { useMutation } from "@tanstack/react-query"
import useNavigateWithSearchParams from "../../../hooks/useNavigateWithSearchParams"
import { VersionToInstall } from "./VersionToInstall"
import apiService from "../../../API/apiService"
import { isNewerVersion, isNoneEmptyArray } from "../../../utils"
import useCustomSearchParams from "../../../hooks/useCustomSearchParams"
import { useChartRepoValues } from "../../../API/repositories"

interface InstallReleaseChartModalProps {
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
  releaseValues,
}: {
  version: string
  userValues?: string
  chart: string
  releaseValues?: string
}) => {
  const formData = new FormData()
  // preview needs to come first, for some reason it has a meaning at the backend
  formData.append("preview", "true")
  formData.append("chart", chart)
  formData.append("version", version)
  formData.append(
    "values",
    userValues ? userValues : releaseValues ? releaseValues : ""
  )
  return formData
}

export const InstallReleaseChartModal = ({
  isOpen,
  onClose,
  chartName,
  currentlyInstalledChartVersion,
  latestVersion,
  isUpgrade = false,
  latestRevision,
}: InstallReleaseChartModalProps) => {
  const navigate = useNavigateWithSearchParams()
  const { setShowErrorModal } = useAlertError()
  const [userValues, setUserValues] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoadingDiff, setIsLoadingDiff] = useState(false)
  const [diff, setDiff] = useState("")

  const {
    namespace: queryNamespace,
    chart: _releaseName,
    context: selectedCluster,
  } = useParams()
  const { searchParamsObject } = useCustomSearchParams()
  const { filteredNamespace } = searchParamsObject
  const [namespace, setNamespace] = useState(queryNamespace)
  const [releaseName, setReleaseName] = useState(_releaseName)

  const { error: versionsError, data: _versions } = useGetVersions(chartName, {
    select: (data) => {
      return data?.sort((a, b) =>
        isNewerVersion(a.version, b.version) ? 1 : -1
      )
    },
    onSuccess: (data) => {
      const empty = { version: "", repository: "", urls: [] }
      return setSelectedVersionData(data[0] ?? empty)
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
    if (!selectedVersionData) return undefined

    return selectedVersionData.urls?.[0]?.startsWith("file://")
      ? selectedVersionData.urls[0]
      : `${selectedVersionData.repository}/${chartName}`
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

  const { data: chartValues } = useChartRepoValues(
    namespace || "default",
    selectedVersion || "",
    chart as string, // it can't be undefined because query is enabled only if it is defined
    {
      enabled:
        Boolean(selectedRepo) && selectedRepo !== "" && chart !== undefined,
    }
  )

  const { data: releaseValues, isLoading: loadingReleaseValues } =
    useChartReleaseValues({
      namespace,
      release: String(releaseName),
      // userDefinedValue: userValues, // for key only
      revision: latestRevision ? latestRevision : undefined,
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
      if (chart) {
        formData.append("chart", chart)
      }
      formData.append("version", selectedVersion || "")
      formData.append("values", userValues)

      const res = await fetch(
        // Todo: Change to BASE_URL from env
        `/api/helm/releases/${
          namespace ? namespace : "default"
        }${`/${releaseName}`}`,
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
          title: `Failed to upgrade the chart`,
          msg: String(await res.text()),
        })
      }

      return res.json()
    },
    {
      onSuccess: async (response) => {
        onClose()
        setSelectedVersionData({ version: "", urls: [] }) //cleanup
        navigate(
          `/${selectedCluster}/${
            namespace ? namespace : "default"
          }/${releaseName}/installed/revision/${response.version}`
        )
        window.location.reload()
      },
      onError: (error) => {
        setErrorMessage((error as Error)?.message || "Failed to update")
      },
    }
  )

  // This fetch data like manifest, we use it for the diff
  const fetchVersionData = useCallback(
    async ({
      version,
      userValues,
    }: {
      version: string
      userValues?: string
    }) => {
      if (!chart) {
        return { manifest: "" }
      }
      const formData = getVersionManifestFormData({
        version,
        userValues,
        chart,
        releaseValues,
        chartName,
      })
      const fetchUrl = `/api/helm/releases/${
        namespace ? namespace : "[empty]"
      }${`/${releaseName}`}`

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
    [chart, chartName, namespace, releaseName, releaseValues]
  )

  // TODO: replace with react query
  const currentVerData = useMemo(() => {
    if (!chart || !currentlyInstalledChartVersion)
      return Promise.resolve({ manifest: "" })

    return fetchVersionData({
      version: currentlyInstalledChartVersion,
    })
  }, [chart, currentlyInstalledChartVersion, fetchVersionData])

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
      if (!selectedRepo || versionsError || !chart) {
        return
      }
      setIsLoadingDiff(true)
      try {
        const selectedVerData = await fetchVersionData({
          version: selectedVersion,
          userValues,
        })

        const formData = new FormData()
        formData.append("a", ((await currentVerData) as any).manifest)
        formData.append("b", (selectedVerData as any).manifest)

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
    [fetchVersionData, chart, currentVerData, setIsLoadingDiff, setDiff]
  )

  useEffect(() => {
    if (
      fetchDiffBody.selectedVersion &&
      fetchDiffBody.selectedRepo &&
      !loadingReleaseValues
    ) {
      fetchDiff(fetchDiffBody)
    }
  }, [fetchDiff, fetchDiffBody, loadingReleaseValues])

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedVersionData({ version: "", urls: [] })
        setUserValues(releaseValues)
        onClose()
      }}
      title={
        <div className="font-bold">
          {`${isUpgrade ? "Upgrade" : "Install"} `}
          {(isUpgrade || releaseValues) && (
            <span className="text-green-700 ">{chartName}</span>
          )}
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
            loadingReleaseValues ||
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
          showCurrentVersion
        />
      )}

      <GeneralDetails
        releaseName={releaseName ?? ""}
        disabled
        namespace={namespace ? namespace : filteredNamespace}
        onReleaseNameInput={setReleaseName}
        onNamespaceInput={setNamespace}
      />
      <div className="flex w-full gap-6 mt-4">
        <UserDefinedValues
          initialValue={releaseValues}
          setValues={setUserValues}
        />

        <ChartValues chartValues={chartValues} loading={loadingReleaseValues} />
      </div>

      <ManifestDiff
        diff={diff}
        isLoading={isLoadingDiff || loadingReleaseValues}
        error={errorMessage || (versionsError as string)}
      />
    </Modal>
  )
}
