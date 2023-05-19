import { Link } from 'react-router-dom';
import LegalPageHeader from '../LegalPageHeader';

import './TermsAndConditions.scss';

const TermsAndConditions = () => {
  return (
    <div className="raft__legal__page">
      <LegalPageHeader title="Terms & Conditions" subtitle="Last updated: 19 May 2023" />
      <div className="raft__legal__contentContainer">
        <div className="raft__legal__content">
          <h3 className="raft__legal__title">1. Introduction</h3>
          <div className="raft__legal__text">
            <p>
              These Terms & Conditions (the “Terms”) are issued by Tempus Labs Inc., a limited company based in the
              British Virgin Islands (the “Issuer”) in association with Tempus Foundation Company, a foundation company
              based in the Cayman Islands (the “Foundation”) (the Issuer and the Foundation together, “Raft”, “we”,
              “our”, or “us”). We own and operate the frontend <Link to="/">app.raft.fi</Link>, which acts as an
              independently deployed and maintained instance of the Raft protocol (the website and any applications
              together, the “Frontend”). These Terms explain the terms and conditions on which you may use and access
              the Frontend. These Terms apply to you as a user of the Frontend (for the avoidance of doubt, this
              includes all apps, products, services, tools, and information made available on the Frontend).
            </p>
            <p>
              Please read these Terms carefully as they explain the terms and conditions on which you may use and access
              the Frontend. In particular, paragraph 7 of the Terms contains important eligibility requirements on who
              may access and use the Frontend. If you do not meet and/or are unable to comply with these eligibility
              requirements, you are not authorised to use (and must immediately stop accessing and using) the Frontend.
              Paragraphs 19 to 21 of the Terms also include provisions which impact your rights as to how disputes are
              resolved, including a binding mandatory arbitration and class action/jury trial waiver provision.
            </p>
            <p>
              By accessing or using the Frontend, you signify that you have read, understand, and agree to be bound by
              the Terms in their entirety. If you do not agree with the Terms, you are not authorised to use (and must
              immediately stop accessing and using) the Frontend.
            </p>
          </div>

          <h3 className="raft__legal__title">2. Modification of the Terms</h3>
          <div className="raft__legal__text">
            <p>
              We reserve the right, in our sole discretion, to modify these Terms at any time. If we make any
              modifications, we will update the date at the top of these Terms. All changes will be immediately
              effective. You should check these Terms periodically to familiarise yourself with any changes. Your
              continued access or use of the Frontend will serve as confirmation of your acceptance of the changes. If
              you do not agree with any modification to these Terms, you must immediately stop accessing and using the
              Frontend.
            </p>
          </div>

          <h3 className="raft__legal__title">3. Transactions carried out on the Frontend</h3>
          <div className="raft__legal__text">
            <p>
              As part of the Frontend, we provide access to crypto applications on the blockchain (which includes any
              blockchain that crypto applications hosted on the Frontend are deployed on, including but not limited to
              Ethereum). These crypto applications allow users to use certain cryptoassets and interact with smart
              contracts deployed on the blockchain (“Smart Contracts'').
            </p>
            <p>
              You may be required to pay a fee (including but not limited to gas costs) to perform a
              transaction/interact with a Smart Contract on the Frontend. You acknowledge and agree that we have no
              control over any transactions or interactions made on the Frontend, the method of payment or interaction,
              or any actual payments of transactions. Accordingly, you must ensure that you have a sufficient balance of
              the applicable cryptocurrency tokens stored in your compatible wallet address to complete any transaction
              or interaction before initiating any such transaction or interaction.
            </p>
          </div>

          <h3 className="raft__legal__title">4. Access to the Frontend</h3>
          <div className="raft__legal__text">
            <p>
              Access to the Frontend is provided “as is” and on an “as available” basis only. To the fullest extent
              permitted by law, we disclaim any representations and warranties of any kind, whether express, implied, or
              statutory, including (but not limited to) the warranties of merchantability and fitness for a particular
              purpose. You understand and agree that your use of the Frontend is at your own risk. A non-exhaustive list
              of risks of using the Frontend can be found in paragraph 6 below.
            </p>

            <p>
              We do not guarantee that the Frontend, or any content on it, will always be available, uninterrupted,
              timely, or secure, or free from errors, omissions, defects, viruses, or other harmful elements. You are
              responsible for configuring your information technology, computer programmes, and platform in order to
              access the Frontend. You should use your own virus protection software.
            </p>

            <p>
              We cannot promise that the use of the Frontend, or any content taken from the Frontend, will not infringe
              the rights of any third party.
            </p>

            <p>
              From time to time, access to the Frontend may be interrupted, suspended or restricted (temporarily or
              permanently), in whole or in part, for any reason whatsoever, including because of a fault, error, or
              unforeseen circumstances (including circumstances or events beyond our control, including without
              limitation any flood, extraordinary weather conditions, earthquake, or other act of God, fire, war,
              insurrection, riot, labour dispute, accident, action of government, communications, power failure, or
              equipment or software malfunction), or because we are carrying out planned maintenance.
            </p>
          </div>

          <h3 className="raft__legal__title">5. All rights reserved</h3>
          <div className="raft__legal__text">
            <p>
              We reserve the right to limit the availability of the Frontend to any person (including imposing age
              restrictions), geographic area, or jurisdiction we so desire and/or to terminate your access to and use of
              the Frontend, at any time and in our sole discretion.
            </p>
            <p>
              We may also suspend or disable your access to the Frontend if we consider it reasonable to do so, e.g. if
              you breach these Terms.
            </p>
            <p>
              We reserve the right to modify, substitute, eliminate, or add to the content of the Frontend at any time.
              Additionally, some of the content may be out of date at any given time and we are under no obligation to
              update it.
            </p>
            <p>
              We will not be liable to you for any loss or damage you may suffer as a result of the Frontend being
              unavailable at any time for any reason.
            </p>

            <p>
              We may cooperate with any law enforcement, court or government investigation or order or third party
              requesting or directing that we disclose information or content or information that you provide on the
              Frontend.
            </p>
          </div>

          <h3 className="raft__legal__title">6. Risks of using the Frontend</h3>
          <div className="raft__legal__text">
            <p>
              You understand and agree that the Frontend and your use of the Frontend involves certain risks, involving
              without limitation the following risks:
            </p>
            <ul>
              <li>
                That any Smart Contracts you interact with are entirely your own responsibility and liability, and that
                we are not party to the Smart Contracts.
              </li>
              <li>
                At any time, access to your cryptoassets may be suspended, terminated, or there may be a delay in your
                access to or use of your cryptoassets, which may result in the cryptoassets diminishing in value or you
                being unable to complete a transaction or interaction in respect of a Smart Contract.
              </li>
              <li>
                The Frontend may be suspended or terminated for any or no reason, which may limit your access to your
                cryptoassets.
              </li>
              <li>
                The Frontend could be impacted by one or more regulatory inquiries or actions, which would impede or
                limit our ability to continue to make available (and so impede or limit your ability to access or use)
                the Frontend.
              </li>
              <li>
                You understand that blockchain technology remains under development, which creates technological and
                security risks when using the Frontend in addition to uncertainty relating to cryptoassets and
                blockchain transactions therein.
              </li>
              <li>
                The cost of transacting on the blockchain is variable and may increase at any time causing impact to any
                activities taking place on the blockchain, which may result in price fluctuations or increased costs
                when using the Frontend.
              </li>
              <li>
                The Frontend may be subject to flaws. You are solely responsible for evaluating any code provided by the
                Frontend. This warning and others we provide in these Terms in no way represents an ongoing duty on us
                to alert you to all of the potential risks of utilising or accessing the Frontend.
              </li>
              <li>
                Cryptography is a progressing field with advances in code cracking and other technical advancements,
                such as the development of quantum computers, which may present risks to the Frontend, and could result
                in the theft or loss of your cryptoassets.
              </li>
            </ul>
            <p>Accordingly, you expressly agree that:</p>
            <ul>
              <li>
                You assume all risk in connection with your access and use of the Frontend, the crypto applications, and
                the Smart Contracts.
              </li>
              <li>
                You alone are responsible for securing the private key(s) associated with your cryptoassets. You
                understand that we do not have access to your private key(s) and that losing control of your private
                key(s) will permanently and irreversibly deny you access to cryptoassets. Neither we nor any other
                person or entity will be able to retrieve or protect your cryptoassets. If your private key(s) are lost,
                then you will not be able to transfer your cryptoassets to any other blockchain address or wallet. If
                this occurs, then you will not be able to realise any value or utility from the cryptoassets that you
                may hold.
              </li>
              <li>
                You expressly waive and release us from any and all liability, claims, causes of action, or damages
                arising from or in any way related to your use of the Frontend, the crypto applications, or the Smart
                Contracts.
              </li>
            </ul>
          </div>

          <h3 className="raft__legal__title">7. Eligibility of use of the Frontend</h3>
          <div className="raft__legal__text">
            <p>In order to access or use the Frontend, you are required to meet the following requirements:</p>
            <ul>
              <li>
                You must be able to form a legally binding contract online either as an individual or on behalf of a
                legal entity.
              </li>
              <li>
                You must have the full right, power, and legal authority to enter into, bind yourself to, and comply
                with the obligations under these Terms (on behalf of yourself and any legal entity for which you may
                access or use the Frontend).
              </li>
              <li>
                If you are agreeing to these Terms on behalf of a legal entity, you must have the legal authority to
                bind the legal entity to these Terms.
              </li>
            </ul>
            <p>You also represent that:</p>
            <ul>
              <li>You are at least 18 years old or the age of majority where you reside, whichever is older.</li>
              <li>
                You are not resident in a jurisdiction where local laws and regulations prohibit you from accessing or
                using the Frontend (including all apps, products, and services made available on the Frontend). For the
                avoidance of doubt, we make no representation that the Frontend is appropriate or available for use in
                any particular jurisdiction. Users who access or use the Frontend do so at their own risk and are
                entirely responsible for compliance with all applicable local laws and regulations in their
                jurisdiction.
              </li>
              <li>
                You are not (a) the subject of economic or trade sanctions administered or enforced by any governmental
                authority or otherwise designated on any list of prohibited or restricted parties, or (b) a citizen,
                resident, or organised in a jurisdiction or territory that is the subject of comprehensive country-wide,
                territory-wide, or regional economic sanctions.
              </li>
              <li>
                You will not access or use the Frontend to conduct, promote, or otherwise facilitate any illegal
                activity.
              </li>
            </ul>
          </div>

          <h3 className="raft__legal__title">8. Conditions of use of the Frontend</h3>
          <div className="raft__legal__text">
            <p>In order to access or use the Frontend, you are required to meet the following conditions:</p>
            <ul>
              <li>You must only use the Frontend for lawful purposes and in accordance with these Terms.</li>
              <li>
                You must ensure that all information you provide on the Frontend is current, complete, and accurate.
              </li>
              <li>
                You must maintain the security and confidentiality of access to your cryptoassets and compatible wallet.
              </li>
              <li>
                You must comply with all local and international laws, statutes, ordinances, and regulations applicable
                to your use of the Frontend.
              </li>
            </ul>
          </div>

          <h3 className="raft__legal__title">9. Prohibitions on use of the Frontend</h3>
          <div className="raft__legal__text">
            <p>
              In order to access or use the Frontend, you also agree not to engage in, attempt to engage in, any of the
              following prohibited activities in relation to your access and use of the Frontend:
            </p>
            <ul>
              <li>
                You must not commit any activity that infringes on or violates any copyright, trademark, service mark,
                patent, right of publicity, right of privacy, or other proprietary or intellectual property rights under
                applicable law.
              </li>
              <li>
                You must not commit any activity that seeks to interfere with or compromise the integrity, security, or
                proper functioning of any computer, server, network, personal device, or other information technology
                system, including (but not limited to) the deployment of viruses and denial of service attacks.
              </li>
              <li>
                You must not use or access the Frontend to transmit cryptoassets that are the direct or indirect
                proceeds of any criminal or fraudulent activity, including, without limitation, terrorism or tax
                evasion.
              </li>
              <li>
                You must not commit any activity that seeks to defraud us or any other person or entity, including (but
                not limited to) providing any false, inaccurate, or misleading information in order to unlawfully obtain
                the property of another.
              </li>
              <li>
                You must not commit any activity that violates any applicable law, rule, or regulation concerning the
                integrity of financial markets.
              </li>
              <li>
                You must not use the Frontend in any manner that could interfere with, disrupt, negatively affect, or
                inhibit other users from fully enjoying the Frontend, or that could damage, disable, overburden, or
                impair the functioning of the Frontend in any manner.
              </li>
              <li>
                You must not attempt to circumvent any content filtering techniques or security measures that we employ
                on the Frontend, or attempt to access any service or area of the Frontend that you are not authorised to
                access.
              </li>
              <li>
                You must not use any robot, spider, crawler, scraper, or other automated means or interface not provided
                by us, to access the Frontend to extract data.
              </li>
              <li>
                You must not introduce any malware, virus, trojan horse, worm, logic bomb, drop-dead device, backdoor,
                shutdown mechanism, or other harmful material into the Frontend.
              </li>
              <li>
                You must not post content or communications on the Frontend that are, in our sole discretion, libellous,
                defamatory, profane, obscene, pornographic, sexually explicit, indecent, lewd, vulgar, suggestive,
                harassing, hateful, threatening, offensive, discriminatory, bigoted, abusive, inflammatory, fraudulent,
                deceptive, or otherwise objectionable.
              </li>
              <li>
                You must not harass, abuse, or harm another person or entity, including the Frontend developers and
                service providers.
              </li>
              <li>
                You must not post content on the Frontend containing unsolicited promotions, commercial messages, or any
                chain messages or user content designed to deceive or trick users of the Frontend.
              </li>
              <li>
                You must not commit any activity that violates any applicable local or international law, rule, or
                regulation, including, without limitation, any relevant and applicable laws concerning (a) gaming,
                betting, and gambling, (b) anti-money laundering and anti-terrorist financing, and (c) privacy and data
                protection.
              </li>
              <li>
                You must not commit any activity that violates any applicable law, rule, or regulation of the Cayman
                Islands or another relevant jurisdiction, including (but not limited to) the restrictions and regulatory
                requirements imposed by the law of the Cayman Islands.
              </li>
              <li>
                You must not encourage or induce any third party to engage in any of the activities prohibited under
                these Terms.
              </li>
            </ul>
          </div>

          <h3 className="raft__legal__title">10. Privacy</h3>
          <div className="raft__legal__text">
            <p>
              When you use the Frontend, the only information we collect from you is your blockchain wallet address,
              completed transaction hashes, and the token names, symbols, or other blockchain identifiers of the tokens
              that you interact with. We do not collect any personal information from you (e.g., your name or other
              identifiers that can be linked to you). We may, however, use third party service providers, which may
              receive or independently obtain your personal information from publicly available sources. We do not
              control how these third parties handle your data and you should review their privacy policies to
              understand how they collect, use, and share your personal information. By accessing and using the
              Frontend, you understand and consent to our data practices and how any service providers we use may treat
              your information.
            </p>
            <p>
              Please also note that when you use the Frontend, you are interacting with the blockchain, which provides
              transparency into your transactions. We do not control and are not responsible for any information you
              make public on the blockchain by taking actions through the Frontend.
            </p>
          </div>

          <h3 className="raft__legal__title">11. Government agencies and co-operation</h3>
          <div className="raft__legal__text">
            <p>
              You understand and agree that we are not registered with any government agencies in any capacity. No
              government agencies have reviewed or approved the Frontend (including, for the avoidance of doubt, any
              applications integrated into and/or hosted on the Frontend). We may however co-operate with any law
              enforcement, court, or government investigation or order, or third party requesting or directing that we
              disclose information or content that you provide on the Frontend.
            </p>
            <p>
              You also understand and agree that we do not facilitate the execution or settlement of your transactions,
              which take place entirely on the public distributed blockchain.
            </p>
          </div>

          <h3 className="raft__legal__title">12. Non-solicitation</h3>
          <div className="raft__legal__text">
            <p>
              You understand and agree that all transactions you submit through the Frontend are considered unsolicited.
              This means that you have not received any investment or financial advice from us in connection with any
              transactions, and that we do not conduct a suitability review of any transactions you submit.
            </p>
          </div>

          <h3 className="raft__legal__title">13. No advice</h3>
          <div className="raft__legal__text">
            <p>
              You understand and agree that all information provided on the Frontend is provided for informational
              purposes only and does not constitute, and should not be construed as, investment advice, or a
              recommendation to buy, sell, or otherwise transact in any investment, including any products or services,
              or an invitation, offer, or solicitation to engage in any investment activity. You should not take, or
              refrain from taking, any action based on any information contained on the Frontend. You alone are
              responsible for determining whether any investment, investment strategy, or related transaction is
              appropriate for you based on your personal investment objectives, financial circumstances, and risk
              tolerance. In addition, nothing on the Frontend shall, or is intended to, constitute financial, legal,
              accounting, or tax advice. We recommend that you seek independent advice if you are in any doubt.
            </p>
          </div>

          <h3 className="raft__legal__title">14. Non-custodial and no fiduciary duty</h3>
          <div className="raft__legal__text">
            <p>
              The Frontend (including the applications) is purely non-custodial, meaning you are solely responsible for
              the custody of the cryptographic private keys to the cryptoasset wallets you hold. These Terms are not
              intended to, and do not create or impose, any fiduciary duties on us. To the fullest extent permitted by
              law, you understand and agree that we owe no fiduciary duties or liabilities to you or any other party,
              and that to the extent any such duties or liabilities may exist at law or in equity, those duties and
              liabilities are hereby irrevocably disclaimed, waived, and eliminated. You further agree that the only
              duties and obligations that we owe you are those set out expressly in these Terms.
            </p>
          </div>

          <h3 className="raft__legal__title">15. Financial and technical sophistication</h3>
          <div className="raft__legal__text">
            <p>
              Any use or interaction with the Frontend requires a certain level of financial and technical
              sophistication to understand the inherent risks, including those listed in these Terms. By accessing and
              using the Frontend, you represent that you are financially and technically sophisticated enough to
              understand the inherent risks associated with using cryptographic and blockchain-based systems, and that
              you have a working knowledge of the usage and intricacies of digital assets and tokens. In particular, you
              understand that blockchain-based transactions are irreversible.
            </p>
            <p>
              You further understand that the markets for these digital assets are highly volatile due to factors
              including (but not limited to) adoption, speculation, technology, security, and regulation. You
              acknowledge and accept that the cost and speed of transacting with cryptographic and blockchain-based
              systems are variable and may increase dramatically at any time. You further understand and accept the risk
              that your digital assets may lose some or all of their value while they are supplied to the Frontend, you
              may suffer loss due to price fluctuations, and experience significant price slippage and cost.
            </p>
            <p>
              You further understand that we are not responsible for any of these variables or risks and cannot be held
              liable for any resulting losses that you experience while accessing or using the Frontend.
            </p>
            <p>
              Accordingly, you understand and agree to assume full responsibility for all of the risks of accessing and
              using the Frontend.
            </p>
          </div>

          <h3 className="raft__legal__title">16. Third party links</h3>
          <div className="raft__legal__text">
            <p>
              The Frontend may contain references or links to third party websites or resources, including (but not
              limited to) information, materials, products, or services, that we do not own or control. Any such
              references or links are provided for convenience only. We do not endorse or assume any responsibility for
              any such resources. If you access any such resources, you do so at your own risk, and you understand that
              these Terms do not apply to your dealings or relationships with any third parties.
            </p>
            <p>
              Your use of a third party website may be governed by the terms and conditions of that third party website.
              You expressly relieve us of any and all liability arising from your use of any such resources, including
              for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any
              such resources.
            </p>
          </div>

          <h3 className="raft__legal__title">17. Indemnity</h3>
          <div className="raft__legal__text">
            <p>
              You agree to hold harmless, release, defend, and indemnify us and our officers, employees, contractors,
              agents, and affiliates from and against all claims, damages, obligations, losses, liabilities, costs, and
              expenses arising from: (a) your access and use of the Frontend; (b) cryptoassets associated with your
              wallet address; (c) your violation of any term or condition of these Terms, the right of any third party,
              or any other applicable local or international law, rule, or regulation; and (d) any other party's access
              and use of the Frontend with your assistance or using any device or account that you own or control.
            </p>
          </div>

          <h3 className="raft__legal__title">18. Limitation of liability</h3>
          <div className="raft__legal__text">
            <p>
              Under no circumstances shall we or any of our officers, employees, contractors, agents, or affiliates be
              liable to you for any indirect, punitive, incidental, special, consequential, or exemplary damages,
              including (but not limited to) damages for loss of profits, goodwill, use, data, or other intangible
              property, arising out of or relating to any access or use of the Frontend, nor will we be responsible for
              any damage, loss, or injury resulting from hacking, tampering, or other unauthorised access or use of the
              Frontend or the information contained within it.
            </p>
            <p>
              We assume no liability or responsibility for any: (a) errors, mistakes, or inaccuracies of content; (b)
              personal injury or property damage, of any nature whatsoever, resulting from any access or use of the
              Frontend; (c) unauthorised access or use of any secure server or database in our control, or the use of
              any information or data stored therein; (d) interruption, unavailability, or cessation of function related
              to the Frontend; (e) bugs, viruses, trojan horses, or the like that may be transmitted to or through the
              Frontend; (f) errors or omissions in, or loss or damage incurred as a result of the use of, any content
              made available through the Frontend; and (g) the defamatory, offensive, or illegal conduct of any third
              party.
            </p>
            <p>
              Under no circumstances shall we or any of our officers, employees, contractors, agents, or affiliates be
              liable to you for any claims, proceedings, liabilities, obligations, damages, losses, or costs in an
              amount exceeding (a) the amount of fees paid by us to you under these Terms, if any, in the twelve month
              period immediately preceding the event giving rise to the claim for liability, or (b) USD $100, whichever
              is greater. This limitation of liability applies regardless of whether the alleged liability is based on
              contract, tort, negligence, strict liability, or any other basis, and even if we have been advised of the
              possibility of such liability. Some jurisdictions do not allow the exclusion of certain warranties or the
              limitation or exclusion of certain liabilities and damages. Accordingly, some of the disclaimers and
              limitations set forth in these Terms may not apply to you. This limitation of liability shall apply to the
              fullest extent permitted by law.
            </p>
          </div>

          <h3 className="raft__legal__title">19. Dispute resolution</h3>
          <div className="raft__legal__text">
            <p>
              We will both use our best efforts to resolve any potential disputes between us through informal, good
              faith negotiations. If a potential dispute arises, you must contact us by sending an email to
              legal@raft.fi so that we can attempt to resolve it without resorting to formal dispute resolution. If we
              aren't able to reach an informal resolution within sixty days of your email, then you and we both agree to
              resolve the potential dispute according to the process set forth under paragraph 21 below.
            </p>
          </div>

          <h3 className="raft__legal__title">20. Class action and jury trial waiver</h3>
          <div className="raft__legal__text">
            <p>
              With respect to all persons and entities, regardless of whether they have used the Frontend for personal,
              commercial, or other purposes, all disputes, controversies, or claims, must be brought in the parties’
              individual capacity, and not as a plaintiff or class member in any purported class action, collective
              action, or other representative proceeding. This waiver applies to class arbitration, and unless we agree
              otherwise, the arbitrator may not consolidate more than one person’s claims. You agree that, by entering
              into the Terms, we are each waiving the right to a trial by jury or to participate in a class action,
              collective action, or other representative proceeding of any kind.
            </p>
          </div>

          <h3 className="raft__legal__title">21. Jurisdiction and arbitration</h3>
          <div className="raft__legal__text">
            <p>
              You agree that any dispute, controversy, or claim arising out of or in relation to these Terms, including
              the validity, invalidity, breach or termination thereof, and your use of the Frontend, or any other acts
              or omissions for which you may contend that we are liable, shall be settled by arbitration in accordance
              with the law of the Cayman Islands. The arbitration shall be held on a confidential basis. The number of
              arbitrators shall be one or three; the seat of the arbitration shall be determined by the arbitrator(s);
              the arbitral proceedings shall be conducted in English. Unless we agree otherwise, the arbitrator(s) may
              not consolidate your claims with those of any other party.
            </p>
            <p>
              You further agree that the Frontend shall be deemed to be based exclusively in the Cayman Islands, and
              that although the Frontend may be available in other jurisdictions, its availability does not give rise to
              general or specific personal jurisdiction in any forum outside of the Cayman Islands.
            </p>
          </div>

          <h3 className="raft__legal__title">22. Governing law</h3>
          <div className="raft__legal__text">
            <p>
              The governing law of these Terms and the Frontend shall be the law of the Cayman Islands, without regard
              to principles of conflicts of laws.
            </p>
          </div>

          <h3 className="raft__legal__title">23. Entire agreement</h3>
          <div className="raft__legal__text">
            <p>
              These Terms (including the Referral Terms & Conditions which are incorporated by reference) constitute the
              entire agreement between you and us with respect to the subject matter hereof (including, for the
              avoidance of doubt, your use of the Frontend and any applications integrated into and/or hosted on the
              Frontend). These Terms supersede any and all prior or contemporaneous written and oral agreements,
              communications and other understandings (if any) relating to the subject matter of the Terms.
            </p>
          </div>

          <h3 className="raft__legal__title">24. Miscellaneous</h3>
          <div className="raft__legal__text">
            <p>
              We may perform any of our obligations, and exercise any of the rights granted to us under these Terms,
              through a third party. We may assign any or all our rights and obligations under these Terms to any third
              party, in whole or in part, without notice or obtaining your consent or approval. You may not assign or
              transfer any right to use the Frontend, or any of your rights or obligations under these Terms, without
              our express prior written consent.
            </p>
            <p>
              If any paragraph or part of any paragraph of these Terms is found to be void, unenforceable. or invalid,
              then it will be severed from these Terms, leaving the remainder in full force and effect, provided that
              the severance has not altered the basic nature of these Terms.
            </p>
            <p>
              Headings of sections of these Terms are for convenience only and shall not be used to limit or construe
              such sections.
            </p>
            <p>
              No single or partial exercise, or failure or delay in exercising any right, power, or remedy by us, shall
              constitute a waiver by us of, or impair or preclude any further exercise of, that or any right, power or
              remedy arising under these Terms or otherwise.
            </p>
            <p>
              If any of the provisions in these Terms are found to be illegal, invalid, or unenforceable by any court of
              competent jurisdiction, the remainder shall continue in full force and effect.
            </p>
            <p>
              All disclaimers, indemnities and exclusions in these Terms shall survive termination of the Terms and
              shall continue to apply during any suspension or any period during which the Frontend is not available for
              you to use for any reason whatsoever.
            </p>
            <p>
              Except as otherwise expressly provided in these Terms, there shall be no third party beneficiaries to
              these Terms.
            </p>
          </div>

          <h3 className="raft__legal__title">25. Contact Us</h3>
          <div className="raft__legal__text">
            <p>
              If you have any questions about these Terms or wish to contact us, please email us at{' '}
              <a href="mailto:legal@raft.fi">legal@raft.fi</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
