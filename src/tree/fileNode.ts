/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { EventEmitter, ThemeIcon, window } from 'vscode';
import { AbstractNode, ITreeNode } from './abstractNode';
import { DataProvider } from './dataProvider';
import { RhamtConfiguration } from '../server/analyzerModel';
import { ModelService } from '../model/modelService';
import * as path from 'path';
import { ConfigurationNode } from './configurationNode';
import { FileItem } from './fileItem';
import { HintNode } from './hintNode';
import { HintsNode } from './hintsNode';
import { ClassificationsNode } from './classificationsNode';
import { ClassificationNode } from './classificationNode';

export class FileNode extends AbstractNode<FileItem> {
    private loading: boolean = false;
    private children = [];
    private issues = [];
    private configforKai: RhamtConfiguration;
    file: string;
    public inProgress: boolean = false;

    constructor(
        config: RhamtConfiguration,
        file: string,
        modelService: ModelService,
        onNodeCreateEmitter: EventEmitter<ITreeNode>,
        dataProvider: DataProvider,
        root: ConfigurationNode) {
        super(config, modelService, onNodeCreateEmitter, dataProvider);
        this.file = file;
        this.root = root;
        this.configforKai = config;
    }

    createItem(): FileItem {
        this.treeItem = new FileItem(this.file);
        this.loading = false;
        this.refresh();
        return this.treeItem;
    }

    delete(): Promise<void> {
        return Promise.resolve();
    }

    getLabel(): string {
        console.log('File Node Label for: ' + this.file);
        console.log('File Node Label: ' + path.basename(this.file));
        return path.basename(this.file);
    }

    public getChildrenCount(): number {
        return this.issues.length;
    }

    public getConfig(): RhamtConfiguration{
        return this.configforKai;
    }

    public getChildren(): Promise<ITreeNode[]> {
        if (this.loading) {
            return Promise.resolve([]);
        }
        return Promise.resolve(this.children);
    }

    public hasMoreChildren(): boolean {
        return this.children.length > 0;
    }

    refresh(): void {
        this.children = [];
        const ext = path.extname(this.file);

        if (this.inProgress) {
            window.showInformationMessage(`inProgress ${this.inProgress}`);
            this.treeItem.iconPath = new ThemeIcon('sync~spin');
        } else if (process.env.CHE_WORKSPACE_NAMESPACE) {
            this.treeItem.iconPath = ext === '.xml' ? 'fa fa-file-o medium-orange' :
                ext === '.java' ? 'fa fa-file-o medium-orange' :
                'fa fa-file';
        } else {
            const icon = ext === '.xml' ? 'file_type_xml.svg' :
                ext === '.java' ? 'file_type_class.svg' :
                'default_file.svg';
            const base = [__dirname, '..', '..', '..', 'resources'];
            this.treeItem.iconPath = {
                light: path.join(...base, 'light', icon),
                dark: path.join(...base, 'dark', icon)
            };
        }

        this.issues = this.root.getChildNodes(this);
        if (this.issues.find(issue => issue instanceof HintNode)) {
            this.children.push(new HintsNode(
                this.config,
                this.file,
                this.modelService,
                this.onNodeCreateEmitter,
                this.dataProvider,
                this.root));
        }
        if (this.issues.find(issue => issue instanceof ClassificationNode)) {
            this.children.push(new ClassificationsNode(
                this.config,
                this.file,
                this.modelService,
                this.onNodeCreateEmitter,
                this.dataProvider,
                this.root));
        }
        this.treeItem.refresh();
    }

  
    public setInProgress(inProgress: boolean): void {
        this.inProgress = inProgress;
        this.refresh();  
        this.dataProvider.refreshNode(this); 
    }
}
