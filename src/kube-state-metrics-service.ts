import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
//import { Service } from 'cdk8s-plus-22'
import * as kplus from 'cdk8s-plus-22';


export class kubeStateMetricsservice extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

    //Port namen sind Int nicht wie String
  const frontends =  new kplus.Service(this,"kube-state-metrics", {ports: [{name: "https-main", port: 8443,/*targetPort:https-main*/}, {name: "https-self", port: 9443,/*targetPort: https-self */}],clusterIP: "None",metadata:{name: "kube-state-metrics", namespace:"monitoring", labels: {"app.kubernetes.io/componen": "exporter", "app.kubernetes.io/name":"kube-state-metrics", "app.kubernetes.io/part-of":"kube-prometheus", "app.kubernetes.io/version":"2.3.0"}}})
  frontends.addSelector("app.kubernetes.io/component", "exporter");
  frontends.addSelector("app.kubernetes.io/name", "kube-state-metrics");
  frontends.addSelector("app.kubernetes.io/part-of", "kube-prometheus");



  }
  
}

const app = new App();
new kubeStateMetricsservice(app, 'kubeStateMetrics-service');
app.synth();

