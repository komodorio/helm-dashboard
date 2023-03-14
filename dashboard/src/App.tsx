//import "./App.css";
import "./index.css";

function App(): JSX.Element {
  /* using tailwind css utilty classes
    we create a big card in the center of the screen
    with a title and instructions on how to run storybook configured
    for this project. (helm-dashboard projecT).
    The title is "Welcome to our project!"
    The instructions include <code> and <pre> tags to display
    the commands to run storybook and for some troubleshooting.
    The card is bordered with slightly rounded corners.
    The card is clickable and will redirect to localhost:6006 
    where storybook is running.
    If there are still any issues, the user shouldn't hesitate to ask for help.
    no login information required. */
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-3xl max-h-3xl w-full bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-2">
          <h1 className="text-2xl font-bold text-gray-800">Welcome to our project!</h1>
          <p className="mt-2">
            To run storybook, run the following commands:
          </p>
          <pre className="mt-2 border-2 bg-gray-400 rounded-sm">
            <code className="text-gray-200">
             &nbsp; npm install &nbsp;<i className="text-gray-300">// to verify that all dependencies are installed</i>
            <br />
            &nbsp; npm run storybook 
            </code>
          </pre>
          <p className="mt-2 text-gray-600">
            If you have trouble, don't hesitate to ask for help.
          </p>
        </div>
        <div className="flex items-center justify-end px-4 py-2 bg-gray-100">
          <a
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            href="http://localhost:6006"
          >
            Run Storybook
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
