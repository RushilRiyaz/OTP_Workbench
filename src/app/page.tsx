import ParameterArea from "@/components/ParameterArea";
import EvaluationArea from "@/components/EvaluationArea";
import JourneyForm from "@/components/JourneyForm";

export default function Home() {
  return (
    <div className="flex h-screen w-full">
      <ParameterArea>
        <JourneyForm />
      </ParameterArea>
      <EvaluationArea />
    </div>
  );
}
