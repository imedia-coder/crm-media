import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Iniciativas Media",
  description:
    "Conditions d'utilisation du logiciel Agency Hub d'Iniciativas Media et de son module de gestion des réseaux sociaux.",
};

const UPDATED = "7 septembre 2026";
const CONTACT_EMAIL = "initiativascapvert@gmail.com";
const LEGAL_NAME = "Iniciativas";
const ADDRESS = "8 rue du Maréchal Maison, 93800 Épinay-sur-Seine, France";

export default function CguPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-1 text-2xl font-semibold">
        Conditions générales d&apos;utilisation
      </h1>
      <p className="mb-10 text-sm text-slate-500">
        Dernière mise à jour : {UPDATED}
      </p>

      <div className="space-y-8 text-sm leading-6 text-slate-700">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">1. Objet</h2>
          <p>
            Les présentes conditions régissent l&apos;accès et
            l&apos;utilisation du logiciel
            <em> Agency Hub</em> (« le Service »), édité et exploité par{" "}
            {LEGAL_NAME}, {ADDRESS}. Le Service est un outil professionnel de
            gestion de production et de publication sur les réseaux sociaux,
            réservé aux équipes de l&apos;agence et à ses clients sous contrat.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            2. Accès et comptes
          </h2>
          <p>
            L&apos;accès se fait sur invitation. Chaque utilisateur est
            responsable de la confidentialité de ses identifiants et des actions
            effectuées depuis son compte. L&apos;agence peut suspendre un accès
            en cas d&apos;usage contraire aux présentes conditions ou aux règles
            des plateformes tierces.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            3. Connexion des comptes de réseaux sociaux
          </h2>
          <p>
            Le client peut connecter ses comptes Facebook, Instagram et TikTok
            via les procédures d&apos;autorisation officielles de Meta et de
            TikTok. En connectant un compte, le client déclare en être titulaire
            ou administrateur autorisé et mandate l&apos;agence pour y publier
            des contenus, y déposer des brouillons et en lire les statistiques,
            dans le cadre de la prestation convenue.
          </p>
          <p>
            L&apos;utilisation des API de Meta et de TikTok par le Service est
            soumise aux conditions de ces plateformes. Le client peut révoquer
            l&apos;autorisation à tout moment ; le Service cesse alors toute
            action sur le compte concerné.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            4. Contenus
          </h2>
          <p>
            Le client garantit détenir les droits nécessaires sur les contenus
            fournis (images, vidéos, musiques, marques). L&apos;agence produit
            et programme les publications selon le brief et le calendrier
            validés. Toute publication automatique reste soumise, lorsque la
            plateforme l&apos;exige, à une confirmation et au respect des règles
            de divulgation de contenu commercial.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            5. Disponibilité
          </h2>
          <p>
            Le Service est fourni « en l&apos;état ». L&apos;agence met en œuvre
            les moyens raisonnables pour assurer sa disponibilité, sans garantie
            d&apos;absence d&apos;interruption. Les délais et le succès des
            publications dépendent aussi des API et de la disponibilité des
            plateformes tierces.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            6. Responsabilité
          </h2>
          <p>
            L&apos;agence n&apos;est pas responsable des conséquences d&apos;une
            suspension, d&apos;une limitation ou d&apos;une modification des
            services de Meta ou de TikTok, ni des contenus fournis par le
            client. La responsabilité de l&apos;agence est limitée au montant de
            la prestation concernée.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            7. Données personnelles
          </h2>
          <p>
            Le traitement des données personnelles est décrit dans la{" "}
            <a className="text-primary underline" href="/confidentialite">
              Politique de confidentialité
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            8. Droit applicable
          </h2>
          <p>
            Les présentes conditions sont régies par le droit français. Tout
            litige relève des tribunaux compétents du ressort du siège de
            l&apos;agence, après tentative de résolution amiable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">9. Contact</h2>
          <p>
            <a
              className="text-primary underline"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
