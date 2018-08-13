import {Pipelyne} from "Pipelyne";
import {safeDump as objectToYaml} from 'js-yaml';

export function getTravisPipeline(
  pipelyne: Pipelyne
): string {
  const ciProviderScript = {};
  ciProviderScript['language'] = 'node_js';
  ciProviderScript['node_js'] = ['8'];
  ciProviderScript['cache'] = {
    directories: ['node_modules'],
  };
  ciProviderScript['script'] = [];
  pipelyne.stages.forEach((stage) => {
    ciProviderScript['script']
      .push(`printf -- "STAGE: ${stage.options.name}"`);
    ciProviderScript['script']
      .push(`set ${(stage.options.allowFailure) ? '+' : '-'}x`);
    stage.jobs.forEach((job) => {
      ciProviderScript['script']
        .push(`printf -- "JOB: ${job.options.name}"`);
      job.commands.forEach((command) => {
        const {allowFailure} = command.options;
        ciProviderScript['script'].push(command.options.script);
      });
    });
  });
  return objectToYaml(ciProviderScript);
}
