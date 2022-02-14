import * as cdk8s from 'cdk8s';
import * as prom from '.';

const app = new cdk8s.App({ yamlOutputType: cdk8s.YamlOutputType.FILE_PER_RESOURCE });

new prom.Grafana(app, 'Grafana');
new prom.Nodeexporter(app, 'node-exporter');
new prom.kubeStateMetricsservice(app,'kube-State-Service');
app.synth();

