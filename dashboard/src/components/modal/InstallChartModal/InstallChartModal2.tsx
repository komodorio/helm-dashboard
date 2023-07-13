import { useParams } from "react-router-dom";
import { UpsertChart } from "./InstallChart";
import { useVersions } from "./state";
import { useChartRepoValues } from "../../../API/repositories";
import { useState } from "react";
import { Form } from "./types";

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '1em' }}>
                <button onClick={onClose}>Close</button>
                {children}
            </div>
        </div>
    );
}

export const InstallChartModal2 = ({
    isOpen,
    onClose,
    chartName,
    currentlyInstalledChartVersion,
    latestVersion,
    state,
}: {
    isOpen: boolean;
    onClose: () => void;
    chartName: string;
    currentlyInstalledChartVersion: string;
    latestVersion: string;
    state: 'install' | 'upgrade';
}) => {
    const {
        namespace,
        chart: releaseName,
        revision,
        context: clusterName,
    } = useParams();

    const versions = useVersions({
        chartName,
        currentlyInstalledChartVersion,
    })

    const newestVersion = versions?.[0];
    const [form, setForm] = useState<Form>({
        releaseName: state === 'install' ? chartName : (releaseName ?? ''),
        repo: newestVersion?.repository,
        namespace,
        version: newestVersion?.version,
        userValues: ''
    })

    const {
        loadable: chartRepoValuesLoadable,
        refetch: refetchChartValues,
    } = useChartRepoValues(
        {
            chartName,
            version: newestVersion?.version,
            repository: newestVersion?.repository,
        }
    );

    if (!clusterName) {
        throw new Error('clusterName is undefined')
    }

    return <Modal isOpen={true} onClose={() => { }}>
        <UpsertChart
            state={state}
            chartName={chartName}
            versions={versions}
            clusterName={clusterName}
            onChange={setForm}
            onSubmit={console.info}
            form={form}
            diff={{
                state: 'loading',
            }}
            chartValues={chartRepoValuesLoadable}
        />
    </Modal>

}