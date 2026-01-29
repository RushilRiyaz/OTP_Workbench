import ParameterArea from "@/components/ParameterArea";
import EvaluationArea from "@/components/EvaluationArea";

export default function Home() {
  return (
    <div className="flex h-screen w-full">
      <ParameterArea />
      <EvaluationArea />
    </div>
  );
}
