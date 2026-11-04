import type { Repository } from "./types";

export interface SuggestedRepository extends Repository {
  description: string;
}

export const POPULAR_REPOSITORIES: SuggestedRepository[] = [
  {
    name: "jetstack",
    url: "https://charts.jetstack.io",
    description: "cert-manager and PKI management tools",
  },
  {
    name: "prometheus-community",
    url: "https://prometheus-community.github.io/helm-charts",
    description: "Prometheus, Alertmanager, and monitoring stack",
  },
  {
    name: "traefik",
    url: "https://traefik.github.io/charts",
    description: "Traefik Ingress controller and reverse proxy",
  },
  {
    name: "grafana",
    url: "https://grafana.github.io/helm-charts",
    description: "Grafana, Loki, Tempo, and observability tooling",
  },
  {
    name: "cilium",
    url: "https://helm.cilium.io/",
    description: "eBPF-based networking, security, and observability",
  },
  {
    name: "argo",
    url: "https://argoproj.github.io/argo-helm",
    description: "Argo Workflows, Argo CD, Argo Events, and Rollouts",
  },
  {
    name: "komodorio",
    url: "https://helm-charts.komodor.io",
    description: "Komodor platform agent and tools",
  },
];
