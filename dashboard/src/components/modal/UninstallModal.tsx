import { useEffect, useState } from "react";
import { StructuredResources } from "../../API/releases";
import Modal, { ModalAction, ModalButtonStyle } from "./Modal";

interface UninstallModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  uninstallTarget: string;
  namespace: string;
  resources: StructuredResources[];
  onClose: () => void;
}

export default function UninstallModal({
  isOpen,
  onConfirm,
  uninstallTarget,
  namespace,
  resources,
  onClose,
}: UninstallModalProps) {
  const uninstallTitle = (
    <div className="font-bold text-2xl">
      Uninstall <span className="text-red-500">{uninstallTarget}</span> from
      namespace <span className="text-red-500">{namespace}</span>
    </div>
  );

  const [confirmModalActions, setConfirmModalActions] =
    useState<ModalAction[]>();

  useEffect(() => {
    setConfirmModalActions([
      {
        id: "1",
        callback: onConfirm,
        variant: ModalButtonStyle.info,
      },
    ]);
  }, [onConfirm]);

  return (
    <Modal
      title={uninstallTitle}
      isOpen={isOpen}
      onClose={onClose}
      actions={confirmModalActions}
    >
      <div>Following resources will be deleted from the cluster:</div>
      <div>
        {resources.map((resource) => (
          <div className="flex gap-7 w-100 mb-3">
            <span className="text-right w-1/5 font-medium italic">
              {resource.kind}
            </span>
            <span className="text-left w-4/5 font-bold">
              {resource.metadata.name}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
