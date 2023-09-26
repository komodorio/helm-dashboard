import { RiExternalLinkLine } from "react-icons/ri";

export const Troubleshoot = () => {
  return (
    <div>
      <a
        href="https://www.komodor.com/helm-dash/?utm_campaign=Helm%20Dashboard%20%7C%20CTA&utm_source=helm-dash&utm_medium=cta&utm_content=helm-dash"
        target="_blank"
        rel="noreferrer"
      >
        <button className="bg-primary text-white p-2 flex items-center rounded text-sm font-medium font-roboto">
          Troubleshoot in Komodor
          <RiExternalLinkLine className="ml-2 text-lg" />
        </button>
      </a>
    </div>
  );
};
