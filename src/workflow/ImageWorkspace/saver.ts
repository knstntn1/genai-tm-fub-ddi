import { saveAs } from 'file-saver';
import { BehaviourType } from '../../workflow/Behaviours/Behaviours';
import { IClassification, saveState, behaviourState, classState, sessionCode, datasetState, ProjectDataset } from '../../state';
import { useTeachableModel } from '../../util/TeachableModel';
import { useAtomValue, useAtom } from 'jotai';
import { useEffect } from 'react';
import ClassifierApp, { TeachableModel } from '@genai-fi/classifier';
import JSZip from 'jszip';
import { addProjectDatasetsToZip } from '@genaitm/util/projectDatasets';

export interface ModelContents {
    behaviours?: string;
    zip?: Blob;
    model?: string;
    metadata?: string;
    weights?: ArrayBuffer;
}

export async function saveProject(
    name: string,
    code: string,
    model?: TeachableModel,
    behaviours?: BehaviourType[],
    samples?: IClassification[],
    datasets: ProjectDataset[] = []
) {
    if (model) {
        const app = new ClassifierApp(
            model.getVariant(),
            model,
            behaviours,
            samples?.map((s) => s.samples)
        );
        app.projectId = code;
        const zipData = await app.save();
        if (zipData) {
            const zip = await JSZip.loadAsync(zipData);
            await addProjectDatasetsToZip(zip, datasets);
            saveAs(await zip.generateAsync({ type: 'blob' }), name);
        }
    }
}

interface Props {
    onSaved?: () => void;
}

export function ModelSaver({ onSaved }: Props) {
    const { model } = useTeachableModel();
    const behaviours = useAtomValue(behaviourState);
    const code = useAtomValue(sessionCode);
    const data = useAtomValue(classState);
    const datasets = useAtomValue(datasetState);
    const [saving, setSaving] = useAtom(saveState);

    useEffect(() => {
        if (saving) {
            model?.setName(saving.name);
            saveProject(
                `${saving.name}.zip`,
                code,
                model,
                saving.behaviours ? behaviours : undefined,
                saving.samples ? data : undefined,
                datasets
            ).then(() => {
                setSaving(null);
                if (onSaved) onSaved();
            });
        }
    }, [saving, code, data, datasets, behaviours, model, onSaved, setSaving]);

    return null;
}
