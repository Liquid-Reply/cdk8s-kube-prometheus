import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { ServiceAccount } from 'cdk8s-plus-22';

export class kubeStateMetricsServiceaccount extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

    //automountServiceAccountToken: false
    new ServiceAccount(this, "ServiceAccount",{metadata:{name:"kube-state-metrics", namespace:"monitoring", labels:{["app.kubernetes.io/component"]:"exporter",["app.kubernetes.io/name"]:"kube-state-metrics",["app.kubernetes.io/part-of"]:"kube-prometheus",["app.kubernetes.io/version"]:"2.3.0"}}})
  }
}

const app = new App();
new kubeStateMetricsServiceaccount(app, 'cdk8s-kubeStateMetrics-ServiceAccount');
app.synth();