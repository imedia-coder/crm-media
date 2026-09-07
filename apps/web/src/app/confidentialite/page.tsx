import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Iniciativas Media",
  description:
    "Comment Iniciativas Media collecte, utilise et protège les données personnelles, y compris les données issues des comptes de réseaux sociaux connectés.",
};

const UPDATED = "7 septembre 2026";
const CONTACT_EMAIL = "initiativascapvert@gmail.com";
const LEGAL_NAME = "Iniciativas";
const ADDRESS = "8 rue du Maréchal Maison, 93800 Épinay-sur-Seine, France";

export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-1 text-2xl font-semibold">
        Politique de confidentialité
      </h1>
      <p className="mb-10 text-sm text-slate-500">
        Dernière mise à jour : {UPDATED}
      </p>

      <div className="space-y-8 text-sm leading-6 text-slate-700">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            1. Responsable du traitement
          </h2>
          <p>
            {LEGAL_NAME} (« l&apos;agence », « nous »), {ADDRESS}, exploite le
            logiciel interne
            <em> Agency Hub</em> et son module de gestion de réseaux sociaux («
            le Service »). Pour toute question relative aux données personnelles
            :{" "}
            <a
              className="text-primary underline"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            2. À qui s&apos;adresse ce document
          </h2>
          <p>
            Le Service est un outil professionnel utilisé par les équipes de
            l&apos;agence et par ses clients (entreprises et créateurs) pour
            produire, valider, programmer et publier des contenus sur leurs
            propres comptes de réseaux sociaux. Il n&apos;est pas destiné au
            grand public et ne propose pas de création de compte libre.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            3. Données collectées
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>
                Comptes utilisateurs de l&apos;agence et des clients
              </strong>{" "}
              : nom, prénom, adresse e-mail, rôle, mot de passe (haché),
              historique d&apos;activité dans le Service.
            </li>
            <li>
              <strong>Données des réseaux sociaux connectés</strong> :
              lorsqu&apos;un client autorise la connexion de ses comptes via
              Facebook Login, l&apos;API Instagram (Meta) ou l&apos;API TikTok,
              nous recevons et stockons : l&apos;identifiant du compte, le nom
              d&apos;utilisateur public, les jetons d&apos;accès (chiffrés), la
              liste des Pages / comptes professionnels administrés, et les
              statistiques de performance des publications (vues, portée,
              interactions, abonnés).
            </li>
            <li>
              <strong>Contenus</strong> : textes, vidéos, images, sous-titres et
              légendes fournis par le client ou produits par l&apos;agence en
              vue d&apos;une publication.
            </li>
            <li>
              <strong>Données techniques</strong> : journaux de connexion et
              d&apos;erreur nécessaires au fonctionnement et à la sécurité du
              Service.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            4. Finalités et bases légales
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Fournir le Service — création, validation, programmation et
              publication de contenus sur les comptes autorisés ; suivi des
              statistiques ; production de rapports.{" "}
              <em>Base : exécution du contrat de prestation.</em>
            </li>
            <li>
              Sécurité, prévention des abus, journalisation.{" "}
              <em>Base : intérêt légitime.</em>
            </li>
            <li>
              Respect des obligations légales et comptables.{" "}
              <em>Base : obligation légale.</em>
            </li>
          </ul>
          <p>
            Les jetons d&apos;accès aux réseaux sociaux sont utilisés uniquement
            pour exécuter les actions demandées par le client (publier, déposer
            un brouillon, lire des statistiques). Ils ne servent à aucune autre
            finalité et ne sont jamais revendus.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            5. Partage des données
          </h2>
          <p>
            Nous ne vendons ni ne louons aucune donnée. Les données ne sont
            partagées qu&apos;avec :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              les <strong>plateformes de réseaux sociaux</strong> (Meta, TikTok)
              strictement pour exécuter les publications et récupérer les
              statistiques, conformément à leurs conditions d&apos;utilisation ;
            </li>
            <li>
              nos <strong>sous-traitants techniques</strong> (hébergement,
              stockage de fichiers, service d&apos;e-mail), liés par contrat et
              situés dans l&apos;Union européenne ou couverts par des garanties
              adéquates ;
            </li>
            <li>
              les <strong>autorités</strong> lorsque la loi l&apos;exige.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            6. Durée de conservation
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Jetons d&apos;accès aux réseaux sociaux : jusqu&apos;à la
              déconnexion du compte ou la fin de la prestation, puis
              suppression.
            </li>
            <li>
              Contenus et statistiques : pendant la durée de la prestation, puis
              archivage limité ou suppression sur demande.
            </li>
            <li>
              Comptes utilisateurs : supprimés ou anonymisés au départ de la
              personne.
            </li>
            <li>Journaux techniques : 12 mois maximum.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            7. Vos droits
          </h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
            rectification, d&apos;effacement, de limitation, d&apos;opposition
            et de portabilité. Vous pouvez retirer à tout moment
            l&apos;autorisation d&apos;accès à un compte de réseau social,
            depuis le Service ou directement dans les paramètres de Facebook,
            Instagram ou TikTok.
          </p>
        </section>

        <section className="space-y-2" id="suppression">
          <h2 className="text-base font-semibold text-slate-900">
            8. Suppression des données
          </h2>
          <p>
            Pour demander la suppression des données associées à un compte de
            réseau social connecté via notre application, ou de l&apos;ensemble
            de vos données :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              écrivez à{" "}
              <a
                className="text-primary underline"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>{" "}
              avec l&apos;objet « Suppression de données » et l&apos;identifiant
              ou le nom du compte concerné ;
            </li>
            <li>
              nous confirmons la suppression sous 30 jours et révoquons
              immédiatement les jetons d&apos;accès correspondants.
            </li>
          </ul>
          <p>
            Vous pouvez aussi retirer l&apos;accès de l&apos;application depuis{" "}
            <span className="text-slate-900">
              Facebook → Paramètres → Applications et sites web
            </span>{" "}
            ou{" "}
            <span className="text-slate-900">
              TikTok → Paramètres → Gérer les applications
            </span>{" "}
            ; les données associées sont alors purgées lors du traitement
            suivant.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            9. Sécurité
          </h2>
          <p>
            Isolation stricte des données par client, chiffrement des jetons
            d&apos;accès, contrôle d&apos;accès par rôle, authentification à
            deux facteurs pour les comptes d&apos;administration, sauvegardes
            régulières et journalisation des actions sensibles.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            10. Modifications
          </h2>
          <p>
            Cette politique peut être mise à jour. La date de dernière mise à
            jour figure en tête de page ; les changements importants sont
            communiqués aux clients concernés.
          </p>
        </section>
      </div>
    </main>
  );
}
