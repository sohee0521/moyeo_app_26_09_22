import Button from "../../components/common/Button";
import { Calendar, MapPin, Utensils, ArrowRight } from "lucide-react";
import PageTitle from "../../components/common/PageTitle";
import moyeoCharacters from "../../img/onboarding-characters.png";

export default function OnboardingPage() {
  const handleOpenCreateModal = () => {
    console.log("방 만들기 클릭");
  };

  const handleOpenJoinModal = () => {
    console.log("참여하기 클릭");
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col justify-between items-center px-4 sm:px-6 py-12 overflow-hidden select-none">
      <PageTitle title="시작하기" />

      {/*  배경 글로우 영역 */}
      <div
        className="opacity-60 pointer-events-none absolute -top-80 -right-80 w-[650px] h-[650px] rounded-full hidden lg:block z-1"
        style={{
          background:
            "radial-gradient(circle, #BBD0FB 0%, rgba(187, 208, 251, 0.4) 30%, rgba(187, 208, 251, 0) 70%)",
        }}
      />

      <div
        className="opacity-60 pointer-events-none absolute top-[55%] -left-60 w-[650px] h-[650px] rounded-full hidden lg:block"
        style={{
          background:
            "radial-gradient(circle, #BBD0FB 0%, rgba(187, 208, 251, 0.35) 30%, rgba(187, 208, 251, 0) 70%)",
        }}
      />

      <div
        className="pointer-events-none absolute top-[16%] md:top-[18%] left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(187, 208, 251, 0.45) 0%, rgba(187, 208, 251, 0) 65%)",
        }}
      />

      {/* 우측 상단 문구  */}
      <div className="absolute top-20 right-20 lg:top-30 lg:right-60 z-20 animate-fade-in-up delay-200">
        <p className="text-mid-gray text-left leading-tight">
          우리끼리 <span className="text-main-blue">모일 땐?</span>
          <br />
          여기로 <span className="text-main-blue">모여!</span>
        </p>
      </div>

      {/* 중앙 메인 콘텐츠 영역 */}
      <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-lg">
        {/* 캐릭터 */}
        <div className="animate-fade-in-up delay-100">
          <div className="relative mb-6 animate-float flex justify-center items-center">
            <div className="w-48 h-36 flex items-center justify-center">
              <img
                src={moyeoCharacters}
                alt="MOYEO 캐릭터"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* 로고 타이틀 */}
        <h5 className="text-main-blue tracking-[1em] uppercase mb-2 animate-fade-in-up delay-200">
          MOYEO
        </h5>

        {/* 서브 카피 */}
        <p className="text-[#AEB3C7] mb-10 text-center animate-fade-in-up delay-300">
          함께라서 더 즐거운 모임의 시작!
        </p>

        {/* 기능 뱃지/소개*/}
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4 text-sub-blue mb-12 w-full">
          <div className="flex items-center gap-1 sm:gap-1.5 animate-fade-in-up delay-400">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] shrink-0" />
            <h6 className="whitespace-nowrap">일정도</h6>
          </div>
          <span className="text-light-gray animate-fade-in-up delay-400">
            |
          </span>

          <div className="flex items-center gap-1 sm:gap-1.5 animate-fade-in-up delay-500">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] shrink-0" />
            <h6 className="whitespace-nowrap">장소도</h6>
          </div>
          <span className="text-light-gray animate-fade-in-up delay-500">
            |
          </span>

          <div className="flex items-center gap-1 sm:gap-1.5 animate-fade-in-up delay-600">
            <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] shrink-0" />
            <h6 className="whitespace-nowrap">식사도</h6>
          </div>
          <span className="text-light-gray animate-fade-in-up delay-600">
            |
          </span>

          <p className="text-left leading-snug pl-0.5 sm:pl-1 text-sub-blue animate-fade-in-up delay-700 whitespace-nowrap">
            모임 준비,
            <br />
            <span className="text-main-blue font-semibold">
              모여에서 한 번에
            </span>
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 w-full animate-fade-in-up delay-800">
          <Button
            variant="pill-light"
            onClick={handleOpenCreateModal}
            className="shadow-sm hover:scale-103"
          >
            방만들기
            <ArrowRight className="w-4 h-4 ml-1.5 stroke-[2.2]" />
          </Button>

          <Button
            variant="pill-dark"
            onClick={handleOpenJoinModal}
            className="shadow-sm hover:scale-103"
          >
            참여하기
            <ArrowRight className="w-4 h-4 ml-1.5 stroke-[2.2]" />
          </Button>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}
