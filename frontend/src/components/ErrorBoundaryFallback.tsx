import GlobalErrorModal from "./modal/GlobalErrorModal";

export const ErrorBoundaryFallback = ({ error }) => {
  return (
    <GlobalErrorModal
      isOpen={true}
      titleText={"An error occurred"}
      contentText={error}
      onClose={(): void => {}}
    />
  );
};
