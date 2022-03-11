import * as cdk8s from "cdk8s";
import { Construct } from "constructs";
import * as k8s from "./imports/k8s";
import * as crd from "./imports/monitoring.coreos.com";

export class NodeExporter extends cdk8s.Chart {
  exporterVersion = "1.3.1";
  selectors = {
    "app.kubernetes.io/component": "exporter",
    "app.kubernetes.io/name": "node-exporter",
    "app.kubernetes.io/part-of": "kube-prometheus",
  };
  version = { "app.kubernetes.io/version": this.exporterVersion };

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.addDaemonset();
    this.addServiceAccount();
    this.addClusterRole();
    this.addClusterRoleBinding();
    this.addServiceMonitor();
  }

  private addServiceMonitor() {
    new crd.ServiceMonitor(this, "node-exporter-servicemonitor", {
      metadata: {
        labels: {
          ...this.selectors,
          ...this.version,
        },
        name: "node-exporter",
        namespace: "monitoring",
      },
      spec: {
        endpoints: [
          {
            bearerTokenFile:
              "/var/run/secrets/kubernetes.io/serviceaccount/token",
            interval: "15s",
            port: "https",
            relabelings: [
              {
                action: crd.ServiceMonitorSpecEndpointsRelabelingsAction.REPLACE,
                regex: "(.*)",
                replacement: "$1",
                sourceLabels: ["__meta_kubernetes_pod_node_name"],
                targetLabel: "instance",
              },
            ],
            scheme: "https",
            tlsConfig: {
              insecureSkipVerify: true,
            },
          },
        ],
        selector: {
          matchLabels: {
            ...this.selectors,
          },
        },
        jobLabel: "app.kubernetes.io/name",
      },
    });
  }

  private addDaemonset() {
    const port = 9100;
    const rbacProxyVersion = "0.11.0";

    new k8s.KubeDaemonSet(this, "node-exporter-daemonset", {
      metadata: {
        namespace: "monitoring",
        name: "node-exporter",
        labels: { ...this.selectors, ...this.version },
      },
      spec: {
        selector: {
          matchLabels: this.selectors,
        },
        template: {
          metadata: {
            annotations: {
              "kubectl.kubernetes.io/default-container": "node-exporter",
            },
            labels: {
              ...this.selectors,
              ...this.version,
            },
          },
          spec: {
            containers: [
              {
                name: "node-exporter",
                image: `quay.io/prometheus/node-exporter:v${this.exporterVersion}`,
                args: [
                  `--web.listen-address=127.0.0.1:${port}`,
                  "--path.sysfs=/host/sys",
                  "--path.rootfs=/host/root",
                  "--no-collector.wifi",
                  "--no-collector.hwmon",
                  "--collector.filesystem.mount-points-exclude=^/(dev|proc|sys|run/k3s/containerd/.+|var/lib/docker/.+|var/lib/kubelet/pods/.+)($|/)",
                  "--collector.netclass.ignored-devices=^(veth.*|[a-f0-9]{15})$",
                  "--collector.netdev.device-exclude=^(veth.*|[a-f0-9]{15})$",
                ],
                resources: {
                  limits: {
                    cpu: k8s.Quantity.fromString("250m"),
                    memory: k8s.Quantity.fromString("180Mi"),
                  },
                  requests: {
                    cpu: k8s.Quantity.fromString("102m"),
                    memory: k8s.Quantity.fromString("180Mi"),
                  },
                },
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities: {
                    add: ["SYS_TIME"],
                    drop: ["ALL"],
                  },
                  readOnlyRootFilesystem: true,
                },
                volumeMounts: [
                  {
                    mountPath: "/host/sys",
                    mountPropagation: "HostToContainer",
                    name: "sys",
                    readOnly: true,
                  },
                  {
                    mountPath: "/host/root",
                    mountPropagation: "HostToContainer",
                    name: "root",
                    readOnly: true,
                  },
                ],
              },
              {
                name: "kube-rbac-proxy",
                image: `quay.io/brancz/kube-rbac-proxy:v${rbacProxyVersion}`,
                args: [
                  "--logtostderr",
                  `--secure-listen-address=[$(IP)]:${port}`,
                  "--tls-cipher-suites=TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305",
                  `--upstream=http://127.0.0.1:${port}/`,
                ],
                ports: [
                  {
                    containerPort: 9100,
                    hostPort: 9100,
                    name: "https",
                  },
                ],
                resources: {
                  limits: {
                    cpu: k8s.Quantity.fromString("20m"),
                    memory: k8s.Quantity.fromString("40Mi"),
                  },
                  requests: {
                    cpu: k8s.Quantity.fromString("10m"),
                    memory: k8s.Quantity.fromString("20Mi"),
                  },
                },
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities: {
                    drop: ["ALL"],
                  },
                  readOnlyRootFilesystem: true,
                  runAsGroup: 65532,
                  runAsNonRoot: true,
                  runAsUser: 65532,
                },
                env: [
                  {
                    name: "IP",
                    valueFrom: {
                      fieldRef: {
                        fieldPath: "status.podIP",
                      },
                    },
                  },
                ],
              },
            ],
            hostNetwork: true,
            hostPid: true,
            nodeSelector: {
              "kubernetes.io/os": "linux",
            },
            priorityClassName: "system-cluster-critical",
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 65534,
            },
            serviceAccountName: "node-exporter",
            tolerations: [
              {
                operator: "Exists",
              },
            ],
            volumes: [
              {
                hostPath: {
                  path: "/sys",
                },
                name: "sys",
              },
              {
                hostPath: {
                  path: "/",
                },
                name: "root",
              },
            ],
            automountServiceAccountToken: true,
          },
        },
        updateStrategy: {
          rollingUpdate: {
            maxUnavailable: k8s.IntOrString.fromString("10%"),
          },
          type: "RollingUpdate",
        },
      },
    });
  }

  private addServiceAccount() {
    new k8s.KubeServiceAccount(this, "node-exporter-serviceaccount", {
      metadata: {
        name: "node-exporter",
        namespace: "monitoring",
        labels: {
          ...this.selectors,
          ...this.version,
        },
      },
      automountServiceAccountToken: false,
    });
  }

  private addClusterRole() {
    new k8s.KubeClusterRole(this, "node-exporter-clusterrole", {
      metadata: {
        name: "node-exporter",
        namespace: "monitoring",
        labels: {
          ...this.selectors,
          ...this.version,
        },
      },
      rules: [
        {
          apiGroups: ["authentication.k8s.io"],
          verbs: ["create"],
          resources: ["tokenreviews"],
        },
        {
          apiGroups: ["authorization.k8s.io"],
          verbs: ["create"],
          resources: ["subjectaccessreviews"],
        },
      ],
    });
  }

  private addClusterRoleBinding() {
    new k8s.KubeClusterRoleBinding(this, "node-exporter-clusterrolebinding", {
      metadata: {
        name: "node-exporter",
        namespace: "monitoring",
        labels: {
          ...this.selectors,
          ...this.version,
        },
      },
      roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "node-exporter",
      },
      subjects: [
        {
          kind: "ServiceAccount",
          name: "node-exporter",
          namespace: "monitoring",
        },
      ],
    });
  }
}
