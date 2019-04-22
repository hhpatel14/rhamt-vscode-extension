import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { ModelService } from './modelService';
import * as open from 'opn';
import { IHint, IQuickFix, IClassification, RhamtConfiguration } from './model';

export interface AnalysisResultsSummary {
    executedTimestamp?: string;
    executionDuration?: string;
    outputLocation?: string;

    hintCount?: number;
    classificationCount?: number;
}

export class AnalysisResultsUtil {
    static loadFromLocation(location: string): Promise<CheerioStatic> {
        return new Promise<CheerioStatic>((resolve, reject) => {
            fs.readFile(location, (err, data: any) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(cheerio.load(data));
                }
            });
        });
    }

    static loadFomData(data: any): CheerioStatic {
        return cheerio.load(data);
    }

    static save(dom: CheerioStatic, location: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(location, dom.xml(), null, e => {
                if (e) reject(e);
                else resolve();
            });
        });
    }

    static openReport(report: string): void {
        open(report);
    }
}

export class AnalysisResults {

    reports: Map<string, string> = new Map<string, string>();
    config: RhamtConfiguration;
    dom: CheerioStatic;

    constructor(config: RhamtConfiguration, dom: CheerioStatic) {
        this.config = config;
        this.dom = dom;
        this.loadReports();
    }

    loadReports(): void {
        this.dom('report-links').children().each((i, ele) => {
            const link: any = {};
            ele.children.forEach((child, i) => {
                switch (child.name) {
                case 'input-file': {
                    link.input = child.children[0].nodeValue;
                    break;
                }
                case 'report-file': {
                    link.report = child.children[0].nodeValue;
                    break;
                }
                }
            });
            this.reports.set(link.input, link.report);
        });
    }

    getHints(): IHint[] {
        const hints: IHint[] = [];
        this.dom('hints').children().each((i, ele) => {
            const id = ModelService.generateUniqueId();
            const hint: IHint = {
                id,
                quickfixes: this.getQuickfixes(ele),
                file: '',
                severity: '',
                ruleId: '',
                effort: '',
                title: '',
                messageOrDescription: '',
                links: [],
                report: '',
                originalLineSource: '',
                lineNumber: 0,
                column: 0,
                length: 0,
                sourceSnippet: ''

            };
            ele.children.forEach((child, i) => {
                switch (child.name) {
                case 'column': {
                    hint.column = Number(child.children[0].nodeValue);
                    break;
                }
                case 'title': {
                    hint.title = child.children[0].nodeValue;
                    break;
                }
                case 'message': {
                    hint.messageOrDescription = child.children[0].nodeValue;
                    break;
                }
                case 'effort': {
                    hint.effort = child.children[0].nodeValue;
                    break;
                }
                case 'file': {
                    hint.file = child.children[0].nodeValue;
                    const report = this.reports.get(hint.file);
                    if (report) {
                        hint.report = report;
                    }
                    break;
                }
                case 'hint': {
                    hint.messageOrDescription = child.children[0].nodeValue;
                    break;
                }
                case 'issue-category': {
                    break;
                }
                case 'links': {
                    break;
                }
                case 'quickfixes': {
                    break;
                }
                case 'rule-id': {
                    hint.ruleId = child.children[0].nodeValue;
                    break;
                }
                }
            });
            hints.push(hint);
        });
        return hints;
    }

    private getQuickfixes(ele: CheerioElement): IQuickFix[] {
        const quickfixes: IQuickFix[] = [];
        return quickfixes;
    }

    getClassifications(): IClassification[] {
        const classifications: IClassification[] = [];
        this.dom('classifications').children().each((i, ele) => {
            const id = ModelService.generateUniqueId();
            const classification = {
                id,
                quickfixes: this.getQuickfixes(ele),
                file: '',
                severity: '',
                ruleId: '',
                effort: '',
                title: id,
                messageOrDescription: '',
                links: [],
                report: '',
                description: ''
            };
            ele.children.forEach((child, i) => {
                switch (child.name) {
                case 'classification': {
                    classification.title = child.children[0].nodeValue;
                    break;
                }
                case 'description': {
                    classification.description = child.children[0].nodeValue;
                    break;
                }
                case 'effort': {
                    classification.effort = child.children[0].nodeValue;
                    break;
                }
                case 'file': {
                    classification.file = child.children[0].nodeValue;
                    const report = this.reports.get(classification.file);
                    if (report) {
                        classification.report = report;
                    }
                    break;
                }
                case 'issue-category': {
                    break;
                }
                case 'links': {
                    break;
                }
                case 'quickfixes': {
                    break;
                }
                case 'rule-id': {
                    classification.ruleId = child.children[0].nodeValue;
                    break;
                }
                }
            });
            classifications.push(classification);
        });
        return classifications;
    }

    getClassificationsFor(file: string): IClassification[] {
        const classifications = [];
        this.getClassifications().forEach(classification => {
            if (classification.file === file) {
                classifications.push(classification);
            }
        });
        return classifications;
    }

    getHintsFor(file: string): IHint[] {
        const hints = [];
        this.getHints().forEach(hint => {
            if (hint.file === file) {
                hints.push(hint);
            }
        });
        return hints;
    }

    deleteIssue(name: string): boolean {
        return false;
    }

    markAsFixed(name: string): boolean {
        return false;
    }
}