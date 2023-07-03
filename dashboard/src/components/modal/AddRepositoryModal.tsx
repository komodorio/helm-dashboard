import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { callApi } from "../../API/releases";
import Spinner from "../Spinner";
import useAlertError from "../../hooks/useAlertError";
import useCustomSearchParams from "../../hooks/useCustomSearchParams";
import { useAppContext } from "../../context/AppContext";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

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
  const [formData, setFormData] = useState<FormKeys>({} as FormKeys);
  const [isLoading, setIsLoading] = useState(false);
  const alertError = useAlertError();
  const { searchParamsObject } = useCustomSearchParams();
  const { repo_url, repo_name } = searchParamsObject;
  const { setSelectedRepo } = useAppContext();
  const { context } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!repo_url || !repo_name) return;
    setFormData({ ...formData, name: repo_name, url: repo_url });
  }, [repo_url, repo_name]);

  const addRepository = () => {
    const body = new FormData();
    body.append("name", formData.name ?? "");
    body.append("url", formData.url ?? "");
    body.append("username", formData.username ?? "");
    body.append("password", formData.password ?? "");

    setIsLoading(true);

    callApi<void>("/api/helm/repositories", {
      method: "POST",
      body,
    })
      .then(() => {
        setIsLoading(false);
        onClose();

        queryClient.invalidateQueries({ queryKey: ["helm", "repositories"] });
        setSelectedRepo(formData.name || "");
        navigate(`/repository/${context}/${formData.name}`, { replace: true });
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
        <div className="flex justify-end p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
          <button
            className="flex items-center text-white font-medium px-3 py-1.5 bg-[#1347FF] hover:bg-[#0b5ed7] focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:bg-blue-300 rounded-lg text-base text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
          <div className="mb-2 text-sm require">Name</div>
          <input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, [e.target.id]: e.target.value })
            }
            required
            id="name"
            type="text"
            placeholder="Komodorio"
            className="rounded-lg p-2 w-full border border-gray-300 focus:outline-none focus:border-sky-500 input-box-shadow"
          />
        </label>
        <label className="flex-1" htmlFor="url">
          <div className="mb-2 text-sm require">URL</div>
          <input
            value={formData.url}
            onChange={(e) =>
              setFormData({ ...formData, [e.target.id]: e.target.value })
            }
            required
            id="url"
            type="text"
            placeholder="https://helm-charts.komodor.io"
            className="rounded-lg p-2 w-full border border-gray-300  focus:outline-none focus:border-sky-500 input-box-shadow"
          />
        </label>
      </div>
      <div className="flex gap-x-3">
        <label className="flex-1 " htmlFor="username">
          <div className="mb-2 text-sm">Username</div>
          <input
            onChange={(e) =>
              setFormData({ ...formData, [e.target.id]: e.target.value })
            }
            required
            id="username"
            type="text"
            className="rounded-lg p-2 w-full border border-gray-300  focus:outline-none focus:border-sky-500 input-box-shadow"
          />
        </label>
        <label className="flex-1" htmlFor="password">
          <div className="mb-2 text-sm">Password</div>
          <input
            onChange={(e) =>
              setFormData({ ...formData, [e.target.id]: e.target.value })
            }
            required
            id="password"
            type="text"
            className="rounded-lg p-2 w-full border border-gray-300 focus:outline-none focus:border-sky-500 input-box-shadow"
          />
        </label>
      </div>
    </Modal>
  );
}

export default AddRepositoryModal;
