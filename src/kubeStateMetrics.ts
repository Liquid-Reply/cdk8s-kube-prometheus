import { Construct } from "constructs";
import { Chart } from "cdk8s";
import * as k8s from "./imports/k8s";

export class KubeStateMetrics extends Chart {
  portMain = "https-main";
  portSelf = "https-self";
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new k8s.KubeService(this, "kube-state-metrics", {
      spec: {
        ports: [
          {
            name: this.portMain,
            port: 8443,
            targetPort: k8s.IntOrString.fromString(this.portMain),
          },
          {
            name: this.portSelf,
            port: 9443,
            targetPort: k8s.IntOrString.fromString(this.portSelf),
          },
        ],
        selector: {
          "app.kubernetes.io/component": "exporter",
          "app.kubernetes.io/name": "kube-state-metrics",
          "app.kubernetes.io/part-of": "kube-prometheus",
        },
        clusterIp: "None",
      },
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

    new k8s.KubeServiceAccount(this, "ServiceAccount", {
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
      automountServiceAccountToken: false,
    });
  }
}
