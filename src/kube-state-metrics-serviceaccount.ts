import { Construct } from "constructs";
import { Chart } from "cdk8s";
import { ServiceAccount } from "cdk8s-plus-22";

export class kubeStateMetricsServiceAccount extends Chart {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    //automountServiceAccountToken: false
    new ServiceAccount(this, "ServiceAccount", {
      metadata: {
        name: "kube-state-metrics",
        namespace: "monitoring",
        labels: {
          ["app.kubernetes.io/component"]: "exporter",
          ["app.kubernetes.io/name"]: "kube-state-metrics",
          ["app.kubernetes.io/part-of"]: "kube-prometheus",
          ["app.kubernetes.io/version"]: "2.3.0",
        },
      },
    });
  }
}
