import { Construct } from "constructs";
import { Chart } from "cdk8s";
import * as kplus from "cdk8s-plus-22";

export class kubeStateMetricsService extends Chart {
  portMain = "https-main";
  portSelf = "https-self";
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const frontends = new kplus.Service(this, "kube-state-metrics", {
      ports: [
        {
          name: this.portMain,
          port: 8443,
          // TODO: API does not yet allow using strings for targetPort
          // targetPort: this.portMain,
        },
        {
          name: this.portSelf,
          port: 9443,
          // TODO: API does not yet allow using strings for targetPort
          // targetPort: this.portSelf,
        },
      ],
      clusterIP: "None",
      metadata: {
        namespace: "monitoring",
        name: "kube-state-metrics",
        labels: {
          "app.kubernetes.io/component": "exporter",
          "app.kubernetes.io/name": "kube-state-metrics",
          "app.kubernetes.io/part-of": "kube-prometheus",
          "app.kubernetes.io/version": "2.3.0",
        },
      },
    });

    frontends.addSelector("app.kubernetes.io/component", "exporter");
    frontends.addSelector("app.kubernetes.io/name", "kube-state-metrics");
    frontends.addSelector("app.kubernetes.io/part-of", "kube-prometheus");
  }
}
