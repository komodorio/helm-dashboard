import React, { useState } from "react";
import Modal from "./Modal";
import { callApi } from "../../API/releases";
import Spinner from "../Spinner";

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

  const addRepository = () => {
    const body = new FormData();
    body.append("name", formData.name);
    body.append("url", formData.url);

    setIsLoading(true);

    callApi<void>("/api/helm/repositories", {
      method: "POST",
      body,
    }).finally(() => {
      setIsLoading(false);
      onClose();
      window.location.reload();
    })
  };

  return (
    <Modal
      containerClassNames={
        "border-2 bg-error-background w-full max-w-5xl"
      }
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
        <label className="flex-1 " htmlFor="Username">
          <div className="mb-2 text-sm">Username</div>
          <input
            onChange={(e) =>
              setFormData({ ...formData, [e.target.id]: e.target.value })
            }
            required
            id="Username"
            type="text"
            className="rounded-lg p-2 w-full border border-gray-300  focus:outline-none focus:border-sky-500 input-box-shadow"
          />
        </label>
        <label className="flex-1" htmlFor="Password">
          <div className="mb-2 text-sm">Password</div>
          <input
            onChange={(e) =>
              setFormData({ ...formData, [e.target.id]: e.target.value })
            }
            required
            id="Password"
            type="text"
            className="rounded-lg p-2 w-full border border-gray-300 focus:outline-none focus:border-sky-500 input-box-shadow"
          />
        </label>
      </div>
    </Modal>
  );
}

export default AddRepositoryModal;
