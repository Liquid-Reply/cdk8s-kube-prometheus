import * as cdk8s from "cdk8s";
// import * as kplus from 'cdk8s-plus-22';
import { Construct } from "constructs";
import { KubeDaemonSet } from "./imports/k8s";

export class Nodeexporter extends cdk8s.Chart {
  exporterVersion = "1.3.1";
  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.addDaemonset();
  }

  private addDaemonset() {
    const selectors = {
      "app.kubernetes.io/component": "exporter",
      "app.kubernetes.io/name": "node-exporter",
      "app.kubernetes.io/part-of": "kube-prometheus",
    };
    const version = { "app.kubernetes.io/version": this.exporterVersion };

    new KubeDaemonSet(this, "node-exporter", {
      metadata: {
        namespace: "monitoring",
        name: "node-exporter",
        labels: { ...selectors, ...version },
      },
      spec: {
        selector: {
          matchLabels: selectors,
        },
        template: {
          spec: {
            containers: [
              {
                name: "node-exporter",
                image: `quay.io/prometheus/node-exporter:${this.exporterVersion}`,
              },
            ],
          },
        },
      },
    });
  }
}
