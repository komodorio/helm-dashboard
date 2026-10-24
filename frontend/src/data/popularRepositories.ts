import type { Repository } from "./types";

export interface SuggestedRepository extends Repository {
  description: string;
}

export const POPULAR_REPOSITORIES: SuggestedRepository[] = [
  {
    name: "bitnami",
    url: "https://charts.bitnami.com/bitnami",
    description: "Production-ready open source application charts",
  },
  {
    name: "jetstack",
    url: "https://charts.jetstack.io",
    description: "cert-manager and PKI management tools",
  },
  {
    name: "ingress-nginx",
    url: "https://kubernetes.github.io/ingress-nginx",
    description: "Community Ingress controller for Kubernetes using NGINX",
  },
  {
    name: "prometheus-community",
    url: "https://prometheus-community.github.io/helm-charts",
    description: "Prometheus, Alertmanager, and monitoring stack",
  },
  {
    name: "grafana",
    url: "https://grafana.github.io/helm-charts",
    description: "Grafana, Loki, Tempo, and observability tooling",
  },
  {
    name: "argo",
    url: "https://argoproj.github.io/helm-charts",
    description: "Argo Workflows, Argo CD, Argo Events, and Rollouts",
  },
  {
    name: "komodorio",
    url: "https://helm-charts.komodor.io",
    description: "Komodor platform agent and tools",
  },
];
