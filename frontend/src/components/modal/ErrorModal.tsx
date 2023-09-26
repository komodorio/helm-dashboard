import Modal from "./Modal";

interface ErrorModalProps {
  isOpen: boolean;
  titleText: string;
  contentText: string;
  onClose: () => void;
}

export default function ErrorModal({
  isOpen,
  onClose,
  titleText,
  contentText,
}: ErrorModalProps) {
  const ErrorTitle = (
    <div className="font-medium text-2xl text-error-color">
      <div className="flex gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          fill="currentColor"
          className="bi bi-exclamation-triangle-fill mt-1"
          viewBox="0 0 16 16"
        >
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </svg>
        {titleText}
      </div>
      <h4 className="alert-heading" />
    </div>
  );

  const bottomContent = (
    <div className="flex py-6 px-4 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
      <span className="text-sm text-muted fs-80 text-gray-500">
        Hint: Komodor has the same HELM capabilities, with enterprise features
        and support.{" "}
        <a
          href="https://www.komodor.com/helm-dash/?utm_campaign=Helm%20Dashboard%20%7C%20CTA&utm_source=helm-dash&utm_medium=cta&utm_content=helm-dash"
          target="_blank" rel="noreferrer"
        >
          <span className="text-link-color underline">Sign up for free.</span>
        </a>
      </span>
    </div>
  );

  return (
    <Modal
      containerClassNames={
        "border-2 border-error-border-color bg-error-background w-2/3"
      }
      title={ErrorTitle}
      isOpen={isOpen}
      onClose={onClose}
      bottomContent={bottomContent}
    >
      <p className="text-error-color border-green-400">{contentText}</p>
    </Modal>
  );
}
