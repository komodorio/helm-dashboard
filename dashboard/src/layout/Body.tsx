import "../App.css";
import Body_content from "./Body_content";
import Body_header from "./Body_header";

export default function Body() {
  return (
    <div className="bg-[url('../assets/body-background.svg)] bg-cover bg-body-background w-full h-screen max-h-screen overflow-y-auto">
      <Body_header />
      <Body_content />
    </div>
  );
}

// background-color: #F4F7FA;
// background-image: url("topographic.svg");
// background-repeat: no-repeat;
// background-position: bottom left;
// background-size: auto 100%;
