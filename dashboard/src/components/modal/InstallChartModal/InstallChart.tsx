import { useState } from "react";
import { NonEmptyArray } from "../../../data/types";
import { isNoneEmptyArray } from "../../../utils";
import { GeneralDetails } from "./GeneralDetails";
import { Version, VersionToInstall } from "./VersionToInstall";
import { UserDefinedValues } from "./UserDefinedValues";
import { ChartValues } from "./ChartValues";
import { Loadable } from "../../../types";
import { ManifestDiff } from "./ManifestDiff";
import { Form } from "./types";

const toFirstCharUppercase = (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1);


const Header: React.FC<{
    state: 'upgrade' | 'install';
    chartName?: string;
    className?: string;
}> = ({ state, chartName, className }) => {

    return (
        // 24px font size
        <h4 className={`text-xl p-4 border-b ${className ?? ''}`}>
            <span className="font-[500]">{toFirstCharUppercase(state)}</span>
            {chartName && <b className="ml-1 text-green-700 font-bold">{chartName}</b>}
        </h4>
    )
}


export interface BaseProps {
    chartName: string;
    versions?: Version[];
    clusterName: string;
    userValues?: string;
    chartValues: Loadable<string>;
    diff: Loadable<string>;
    onChange: (form: Form) => void;
    onSubmit: (form: Form) => void;
    form: Form;
}

interface UpgradeProps {
    state: 'upgrade';
    // releaseName: string;
    // namespace: string;
}

interface InstallProps {
    state: 'install';
}

export type Props = BaseProps & (UpgradeProps | InstallProps);


export const UpsertChart: React.FC<Props> = (props) => {
    const { state, chartName, versions, clusterName, chartValues, diff } = props
    const [form, _setForm] = useState<Form>(props.form)
    const [selectedVersion, setSelectedVersion] = useState<Version | undefined>()
    const setForm = (newVal: Partial<Form>) => {
        const newForm = { ...form, ...newVal }
        _setForm(newForm)
        props.onChange(newForm)
    }

    return <div className="flex justify-center flex-col height-full">
        <Header state={state} chartName={chartName} className="flex-1" />
        <div className="flex-1 p-4 space-y-4">
            {versions && isNoneEmptyArray(versions) && <VersionToInstall versions={versions} onSelectVersion={setSelectedVersion} />}
            <GeneralDetails
                clusterName={clusterName}
                releaseName={form.releaseName}
                disabled={state === 'upgrade'}
                namespace={form.namespace}
                onReleaseNameInput={releaseName => setForm({ releaseName })}
                onNamespaceInput={namespace => setForm({ namespace })}
            />
            <div className="flex w-full gap-6 mt-4">
                <UserDefinedValues
                    initialValue={props.userValues}
                    setValues={userValues => setForm({ userValues })}
                />
                <ChartValues
                    chartValues={chartValues}
                />
            </div>
            <ManifestDiff
                diff={diff}
            />
        </div>

    </div>
}

