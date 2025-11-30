import { useState } from "react";
import Modal from "./Modal";
import Spinner from "../Spinner";
import useAlertError from "../../hooks/useAlertError";
import useCustomSearchParams from "../../hooks/useCustomSearchParams";
import { useAppContext } from "../../context/AppContext";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import apiService from "../../API/apiService";

interface FormKeys {
  name: string;
  url: string;
  username: string;
  password: string;
}

type AddRepositoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function AddRepositoryModal({ isOpen, onClose }: AddRepositoryModalProps) {
  const {
    searchParamsObject: { repo_url, repo_name },
  } = useCustomSearchParams();
  const [formData, setFormData] = useState<FormKeys>({
    name: repo_name ?? "",
    url: repo_url ?? "",
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const alertError = useAlertError();
  const { setSelectedRepo } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const addRepository = () => {
    const body = new FormData();
    body.append("name", formData.name ?? "");
    body.append("url", formData.url ?? "");
    body.append("username", formData.username ?? "");
    body.append("password", formData.password ?? "");

    setIsLoading(true);

    apiService
      .fetchWithDefaults<void>("/api/helm/repositories", {
        method: "POST",
        body,
      })
      .then(() => {
        setIsLoading(false);
        onClose();

        queryClient.invalidateQueries({
          queryKey: ["helm", "repositories"],
        });
        setSelectedRepo(formData.name || "");
        navigate(`/repository/${formData.name}`, {
          replace: true,
        });
      })
      .catch((error) => {
        alertError.setShowErrorModal({
          title: "Failed to add repo",
          msg: error.message,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Modal
      containerClassNames={"w-full max-w-5xl"}
      title="Add Chart Repository"
      isOpen={isOpen}
      onClose={onClose}
      bottomContent={
        <div className="flex justify-end gap-2 rounded-b border-t border-gray-200 p-6">
          <button
            data-cy="add-chart-repository-button"
            className="flex cursor-pointer items-center rounded-lg bg-primary px-3 py-1.5 text-center text-base font-medium text-white hover:bg-add-repo focus:ring-4 focus:ring-blue-300 focus:outline-hidden disabled:bg-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            onClick={addRepository}
            disabled={isLoading}
          >
            {isLoading && <Spinner size={4} />}
            Add Repository
          </button>
        </div>
      }
    >
      <div className="flex gap-x-3">
        <label className="flex-1" htmlFor="name">
          <div className="require mb-2 text-sm">Name</div>
          <input
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                [e.target.id]: e.target.value,
              })
            }
            required
            id="name"
            data-cy="add-chart-name"
            type="text"
            placeholder="Komodorio"
            className="input-box-shadow w-full rounded-lg border border-gray-300 p-2 focus:border-sky-500 focus:outline-hidden"
          />
        </label>
        <label className="flex-1" htmlFor="url">
          <div className="require mb-2 text-sm">URL</div>
          <input
            value={formData.url}
            onChange={(e) =>
              setFormData({
                ...formData,
                [e.target.id]: e.target.value,
              })
            }
            required
            id="url"
            data-cy="add-chart-url"
            type="text"
            placeholder="https://helm-charts.komodor.io"
            className="input-box-shadow w-full rounded-lg border border-gray-300 p-2 focus:border-sky-500 focus:outline-hidden"
          />
        </label>
      </div>
      <div className="mt-6 flex gap-x-3">
        <label className="flex-1" htmlFor="username">
          <div className="mb-2 text-sm">Username</div>
          <input
            onChange={(e) =>
              setFormData({
                ...formData,
                [e.target.id]: e.target.value,
              })
            }
            required
            id="username"
            type="text"
            className="input-box-shadow w-full rounded-lg border border-gray-300 p-2 focus:border-sky-500 focus:outline-hidden"
          />
        </label>
        <label className="flex-1" htmlFor="password">
          <div className="mb-2 text-sm">Password</div>
          <input
            onChange={(e) =>
              setFormData({
                ...formData,
                [e.target.id]: e.target.value,
              })
            }
            required
            id="password"
            type="text"
            className="input-box-shadow w-full rounded-lg border border-gray-300 p-2 focus:border-sky-500 focus:outline-hidden"
          />
        </label>
      </div>
    </Modal>
  );
}

export default AddRepositoryModal;
