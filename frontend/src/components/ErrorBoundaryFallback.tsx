import GlobalErrorModal from "./modal/GlobalErrorModal";

export const ErrorBoundaryFallback = ({ error }) => {
  return (
    <GlobalErrorModal
      isOpen={true}
      titleText={error.title}
      contentText={error.message}
      onClose={(): void => {}}
    />
  );
};
