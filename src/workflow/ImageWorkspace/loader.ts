import { useEffect } from 'react';
import { BehaviourType } from '../Behaviour/Behaviour';
import { behaviourState, classState, datasetState, fileData, loadState, modelState, sessionCode, ProjectDataset } from '../../state';
import { useAtom, useSetAtom } from 'jotai';
import { useSearchParams } from 'react-router-dom';
import ClassifierApp, { TeachableModel } from '@genai-fi/classifier';
import { ISample } from '@genai-fi/classifier/main/ClassifierApp';
import { loadProjectDatasetsFromZip } from '@genaitm/util/projectDatasets';

interface Project {
    id?: string;
    model?: TeachableModel;
    behaviours?: BehaviourType[];
    samples?: ISample[][];
    labels?: string[];
    datasets?: ProjectDataset[];
}

export async function loadProject(file: File | Blob): Promise<Project> {
    const [app, datasets] = await Promise.all([ClassifierApp.load(file), loadProjectDatasetsFromZip(file)]);

    return {
        id: app.projectId,
        model: app.model,
        behaviours: app.behaviours,
        samples: app.samples,
        labels: app.getLabels(),
        datasets,
    };
}

interface Props {
    onLoaded?: (hadBehaviours: boolean) => void;
    onError?: (err: unknown) => void;
}

function mapToURL(project: string) {
    if (project.startsWith('http')) {
        return project;
    }
    if (project.length === 8 && /^[a-z0-9]+$/i.test(project)) {
        return `${import.meta.env.VITE_APP_API}/model/${project}/project.zip`;
    }
}

export function ModelLoader({ onLoaded, onError }: Props) {
    const [projectFile, setProjectFile] = useAtom(fileData);
    const [params] = useSearchParams();
    const setBehaviours = useSetAtom(behaviourState);
    const setCode = useSetAtom(sessionCode);
    const setData = useSetAtom(classState);
    const setDatasets = useSetAtom(datasetState);
    const setLoading = useSetAtom(loadState);
    const setModel = useSetAtom(modelState);

    useEffect(() => {
        if (params.has('project')) {
            const project = params.get('project');
            if (project) {
                setLoading(true);
                const url = mapToURL(project);
                if (!url) return;

                fetch(url)
                    .then(async (result) => {
                        if (result.status !== 200) {
                            if (onError) onError(result);
                            setLoading(false);
                            return;
                        }
                        const project = await loadProject(await result.blob());

                        setData(
                            project.samples
                                ? project.samples.map((s, i) => ({ label: project.labels?.[i] || '', samples: s }))
                                : []
                        );

                        if (project.model) {
                            setModel(project.model);
                        }
                        if (project.behaviours) {
                            setBehaviours(project.behaviours);
                        }
                        setDatasets(project.datasets ?? []);

                        setLoading(false);
                        if (onLoaded) {
                            onLoaded(!!project.behaviours);
                        }
                    })
                    .catch((e) => {
                        if (onError) onError(e);
                        setLoading(false);
                    });
            }
        }
    }, [params, onLoaded, setData, setDatasets, setBehaviours, onError, setLoading]);

    useEffect(() => {
        if (projectFile) {
            setLoading(true);
            loadProject(projectFile)
                .then((project) => {
                    if (project.id) setCode(project.id);

                    setData(
                        project.samples
                            ? project.samples.map((s, i) => ({ label: project.labels?.[i] || '', samples: s }))
                            : []
                    );

                    if (project.model) {
                        setModel(project.model);
                    }
                    if (project.behaviours) {
                        setBehaviours(project.behaviours);
                    }
                    setDatasets(project.datasets ?? []);

                    setLoading(false);
                    if (onLoaded) {
                        onLoaded(!!project.behaviours);
                    }

                    /*if (project.behaviours && !resetOnLoad) {
                        onSkip(1);
                    }*/
                    setProjectFile(null);
                })
                .catch((e) => {
                    if (onError) onError(e);
                    setProjectFile(null);
                    setLoading(false);
                });
        }
    }, [projectFile, setProjectFile, onLoaded, setData, setDatasets, setCode, setBehaviours, onError, setLoading]);

    return null;
}
